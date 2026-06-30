import { Injectable, NotFoundException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { MatchExplanation } from './types/match-explanation.type';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MatchExplanationService {
  private readonly ai: GoogleGenAI;

  constructor(private readonly prisma: PrismaService) {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });
  }

  async generate(
    jobText: string,
    candidateText: string,
    matchPercentage: number,
  ): Promise<MatchExplanation> {
    const prompt = `
                    You are an expert recruiter.
                    Compare the Job Description and Candidate Resume.
                    Return ONLY valid JSON.
                    {
                      "strengths": ["skill1", "skill2"],
                      "gaps": ["missing skill1", "missing skill2"],
                      "pitch": "Short recruiter summary"
                    }
                    Rules:
                    - strengths must be an array of strings
                    - gaps must be an array of strings
                    - pitch must be maximum 50 words
                    - Do NOT wrap the JSON in markdown
                    - Do NOT include any explanation outside the JSON
                    Match Score: ${matchPercentage}%
                    JOB DESCRIPTION:
                    ${jobText}
                    CANDIDATE RESUME:
                    ${candidateText}
                  `;

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let content = response.text ?? '{}';

    content = content
      .replace(/^```json/i, '')
      .replace(/^```/i, '')
      .replace(/```$/i, '')
      .trim();

    try {
      return JSON.parse(content) as MatchExplanation;
    } catch (error) {
      throw new Error(`Failed to parse Gemini response: ${content}`);
    }
  }

  async getOrGenerate(
    jobId: string,
    candidateId: string,
  ): Promise<MatchExplanation> {
    const match = await this.prisma.matchResult.findUnique({
      where: {
        jobId_candidateId: {
          jobId,
          candidateId,
        },
      },
      include: {
        job: true,
        candidate: {
          include: {
            resume: true,
          },
        },
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const resume = match.candidate.resume;

    const hasHashes =
      !!match.job.textHash &&
      !!resume?.textHash &&
      !!match.jobTextHash &&
      !!match.candidateTextHash;

    const cacheValid =
      hasHashes &&
      match.job.textHash === match.jobTextHash &&
      resume?.textHash === match.candidateTextHash;

    if (cacheValid && match.pitch && match.strengths && match.gaps) {
      return {
        strengths: match.strengths as string[],
        gaps: match.gaps as string[],
        pitch: match.pitch,
      };
    }

    const explanation = await this.generate(
      match.job.extractedText!,
      resume!.extractedText!,
      Math.round(match.finalScore * 100),
    );

    await this.prisma.matchResult.update({
      where: {
        id: match.id,
      },
      data: {
        strengths: explanation.strengths,
        gaps: explanation.gaps,
        pitch: explanation.pitch,

        jobTextHash: match.job.textHash!,
        candidateTextHash: resume!.textHash!,
      },
    });
    return explanation;
  }
}
