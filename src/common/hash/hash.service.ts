import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

@Injectable()
export class HashService {
  generate(text: string): string {
    return createHash('sha256').update(text.trim()).digest('hex');
  }
}
