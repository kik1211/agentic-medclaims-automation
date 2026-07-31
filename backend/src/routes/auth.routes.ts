import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { RegisterUserSchema, LoginUserSchema } from '../schemas/auth.schema.js';

const router = Router();

router.post(
  '/register',
  validateRequest({ body: RegisterUserSchema }),
  authController.register
);

router.post(
  '/login',
  validateRequest({ body: LoginUserSchema }),
  authController.login
);

router.get(
  '/me',
  authenticate,
  authController.getMe
);

export default router;
