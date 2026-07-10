import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import {
  ALLOWED_RESUME_MIME_TYPES,
  MAX_RESUME_SIZE,
} from '../../common/constants/file.constants';

export const resumeUploadOptions = {
  storage: diskStorage({
    destination: './uploads/resumes',

    filename: (_, file, cb) => {
      cb(null, `${randomUUID()}${extname(file.originalname)}`);
    },
  }),

  limits: {
    fileSize: MAX_RESUME_SIZE,
  },

  fileFilter: (_, file, cb) => {
    if (ALLOWED_RESUME_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestException('Only PDF files are allowed'), false);
    }
  },
};
