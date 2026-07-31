import { z } from 'zod';

export const UserRoleEnum = z.enum(['ADMIN', 'HOSPITAL_USER', 'REVIEWER']);

export const RegisterUserSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(1, 'Full name is required'),
  hospital_id: z.string().min(1, 'Hospital ID is required'),
  role: UserRoleEnum.default('HOSPITAL_USER'),
});

export type RegisterUserRequest = z.infer<typeof RegisterUserSchema>;

export const LoginUserSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginUserRequest = z.infer<typeof LoginUserSchema>;
