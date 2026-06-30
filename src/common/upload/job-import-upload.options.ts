import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';

export const jobImportUploadOptions = {
  storage: diskStorage({
    destination: './uploads/job-imports',

    filename: (_, file, cb) => {
      const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);

      cb(null, `${uniqueName}${extname(file.originalname)}`);
    },
  }),

  fileFilter: (_, file, cb) => {
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];

    const extension = extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      return cb(
        new BadRequestException('Only CSV and Excel files are allowed'),
        false,
      );
    }

    cb(null, true);
  },

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
};
