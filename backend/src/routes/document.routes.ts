import { Router } from 'express';
import multer from 'multer';
import { documentController } from '../controllers/document.controller.js';
import { validateRequest } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { BadRequestError } from '../errors/AppError.js';
import { UploadDocumentSchema, DocumentIdParamSchema } from '../schemas/document.schema.js';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestError(`Invalid file type '${file.mimetype}'. Only PDF, PNG, and JPEG files are allowed.`));
    }
  },
});

const router = Router();

router.post(
  '/upload',
  authenticate,
  upload.single('file'),
  validateRequest({ body: UploadDocumentSchema }),
  documentController.uploadDocument
);

router.get(
  '/:id',
  authenticate,
  validateRequest({ params: DocumentIdParamSchema }),
  documentController.getDocumentById
);

router.post(
  '/:id/ocr',
  authenticate,
  validateRequest({ params: DocumentIdParamSchema }),
  documentController.processOcr
);

router.delete(
  '/:id',
  authenticate,
  validateRequest({ params: DocumentIdParamSchema }),
  documentController.deleteDocument
);

export default router;
