import { z } from 'zod';
import { UserRole, ContractType } from './enums';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  passwordHash: z.string(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().nullable(),
  role: z.nativeEnum(UserRole),
  isActive: z.boolean(),
  photoUrl: z.string().nullable(),
  language: z.string().nullable(),
  hourlyRate: z.number().nonnegative().nullable(),
  contractType: z.nativeEnum(ContractType).nullable(),
  mustChangePassword: z.boolean(),
  createdBy: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserDto = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().nullable().optional(),
  role: z.nativeEnum(UserRole),
  language: z.string().nullable().optional(),
  hourlyRate: z.number().nonnegative().nullable().optional(),
  contractType: z.nativeEnum(ContractType).nullable().optional(),
  isActive: z.boolean().optional().default(true),
});

export type CreateUserDto = z.infer<typeof CreateUserDto>;

export const UpdateUserDto = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().nullable().optional(),
  role: z.nativeEnum(UserRole).optional(),
  hourlyRate: z.number().nonnegative().nullable().optional(),
  contractType: z.nativeEnum(ContractType).nullable().optional(),
  isActive: z.boolean().optional(),
  language: z.string().nullable().optional(),
});

export type UpdateUserDto = z.infer<typeof UpdateUserDto>;

export const UserResponse = UserSchema.omit({ passwordHash: true });

export type UserResponse = z.infer<typeof UserResponse>;

export const UserQueryDto = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.coerce.boolean().optional(),
  contractType: z.nativeEnum(ContractType).optional(),
  search: z.string().max(100).optional(),
});

export type UserQueryDto = z.infer<typeof UserQueryDto>;

export const LoginDto = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type LoginDto = z.infer<typeof LoginDto>;

export const AuthTokens = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
});

export type AuthTokens = z.infer<typeof AuthTokens>;

export const LoginResponse = z.object({
  user: UserResponse,
  tokens: AuthTokens,
});

export type LoginResponse = z.infer<typeof LoginResponse>;

export const ChangePasswordDto = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8).max(100),
});

export type ChangePasswordDto = z.infer<typeof ChangePasswordDto>;

export const ForgotPasswordDto = z.object({
  email: z.string().email(),
});

export type ForgotPasswordDto = z.infer<typeof ForgotPasswordDto>;

export const ResetPasswordDto = z.object({
  token: z.string(),
  password: z.string().min(8).max(100),
});

export type ResetPasswordDto = z.infer<typeof ResetPasswordDto>;
