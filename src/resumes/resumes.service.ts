import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { unlink } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { ResumeParserService } from './resume-parser.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { CandidateTextBuilderService } from './candidate-text-builder.service';
import { HashService } from '../common/hash/hash.service';

@Injectable()
export class ResumesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resumeParserService: ResumeParserService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly candidateTextBuilderService: CandidateTextBuilderService,
    private readonly hashService: HashService,
  ) {}

  async uploadResume(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Resume file is required');
    }

    const candidate = await this.prisma.candidate.findUnique({
      where: {
        userId,
      },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const existingResume = await this.prisma.resume.findUnique({
      where: {
        candidateId: candidate.id,
      },
    });

    const oldFileUrl = existingResume?.fileUrl;

    const fileUrl = join('uploads', 'resumes', file.filename).replace(
      /\\/g,
      '/',
    );

    let extractedText: string | null = null;

    try {
      // add extracted text
      extractedText = await this.resumeParserService.extractText(
        join(process.cwd(), fileUrl),
      );
      console.log(extractedText.includes('\0'));
    } catch (error) {
      console.log(`Resume parsing failed: ${error}`);
    }

    const resume = await this.prisma.resume.upsert({
      where: {
        candidateId: candidate.id,
      },
      update: {
        fileName: file.originalname,
        fileUrl,
        mimeType: file.mimetype,
        fileSize: file.size,
        extractedText,
        uploadedAt: new Date(),
      },
      create: {
        candidateId: candidate.id,
        fileName: file.originalname,
        fileUrl,
        mimeType: file.mimetype,
        fileSize: file.size,
        extractedText,
      },
    });

    const text = await this.regenerateCandidateText(
      resume.id,
      candidate.id,
      extractedText!,
    );
    if (!text) {
      throw new BadRequestException('Resume extracted text not found');
    }
    console.log(text.includes('\0'));
    const MAX_CHARS = 2000;
    const shortText = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;

    // generate embedding
    const embedding = await this.embeddingsService.createEmbedding(shortText);

    // save embedding in db
    await this.embeddingsService.saveEmbedding('resume', resume.id, embedding);

    if (oldFileUrl) {
      try {
        await unlink(join(process.cwd(), oldFileUrl));
      } catch {
        // ignore if file not found
      }
    }

    return {
      message: 'Resume uploaded successfully',
      resume,
    };
  }

  async getResume(userId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: {
        userId,
      },
      include: {
        resume: true,
      },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    if (!candidate.resume) {
      throw new NotFoundException('Resume not found');
    }

    return {
      id: candidate.resume.id,
      fileName: candidate.resume.fileName,
      fileUrl: candidate.resume.fileUrl,
      mimeType: candidate.resume.mimeType,
      fileSize: candidate.resume.fileSize,
      uploadedAt: candidate.resume.uploadedAt,
    };
  }

  async regenerateCandidateText(
    id: string,
    candidateId: string,
    text: string,
  ): Promise<string | void> {
    const candidate = await this.prisma.candidate.findUnique({
      where: {
        id: candidateId,
      },
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!candidate) {
      return;
    }

    const skillNames = candidate.skills.map((s) => s.skill.name);
    const extractedText = this.candidateTextBuilderService.build(
      text,
      skillNames,
    );

    const hash = this.hashService.generate(extractedText);
    await this.prisma.resume.update({
      where: {
        id,
      },
      data: {
        extractedText,
        textHash: hash,
      },
    });
    return extractedText;
  }
}
