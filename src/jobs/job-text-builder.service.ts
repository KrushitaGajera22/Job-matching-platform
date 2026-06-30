import { Injectable } from '@nestjs/common';

@Injectable()
export class JobTextBuilderService {
  build(title: string, description: string, skills: string[]): string {
    return `
        Title:
        ${title}

        Skills:
        ${skills.join(', ')}

        Description:
        ${description}
            `.trim();
  }
}
