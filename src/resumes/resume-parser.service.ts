import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import { PDFParse } from 'pdf-parse';

@Injectable()
export class ResumeParserService {
  async extractText(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);

    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const cleanedText = this.sanitizeText(result.text.trim());

    return cleanedText;
  }

  private sanitizeText(text: string): string {
    return text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
