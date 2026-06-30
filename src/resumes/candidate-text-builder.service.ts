import { Injectable } from '@nestjs/common';

@Injectable()
export class CandidateTextBuilderService {
  build(text: string, skills: string[]): string {
    return `
        Skills:
        ${skills.join(', ')}

        ExtractedText:
        ${text}
            `.trim();
  }
}
