import 'express';

export interface AuthUserPayload {
  userId: string;
  email: string;
  hospitalId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: AuthUserPayload;
    }
    interface Locals {
      requestId?: string;
    }
  }
}
