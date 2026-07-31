import { IUserRepository, userRepository, UserEntity } from '../repositories/user.repository.js';
import { RegisterUserRequest, LoginUserRequest } from '../schemas/auth.schema.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateAccessToken } from '../utils/jwt.js';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';

export interface UserProfileResponse {
  id: string;
  hospital_id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: UserProfileResponse;
  accessToken: string;
}

export class AuthService {
  constructor(private readonly userRepo: IUserRepository = userRepository) {}

  private mapToProfile(user: UserEntity): UserProfileResponse {
    return {
      id: user.id,
      hospital_id: user.hospital_id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  public async register(data: RegisterUserRequest): Promise<AuthResponse> {
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) {
      throw new BadRequestError(`User with email '${data.email}' already exists`);
    }

    const password_hash = await hashPassword(data.password);
    const timestamp = new Date().toISOString();

    const createdUser = await this.userRepo.create({
      hospital_id: data.hospital_id,
      email: data.email,
      password_hash,
      full_name: data.full_name,
      role: data.role as UserEntity['role'],
      created_at: timestamp,
      updated_at: timestamp,
    });

    logger.info(`AuthService: Registered new user ${createdUser.id} (${createdUser.email})`);

    const accessToken = generateAccessToken({
      userId: createdUser.id,
      email: createdUser.email,
      hospitalId: createdUser.hospital_id,
      role: createdUser.role,
    });

    return {
      user: this.mapToProfile(createdUser),
      accessToken,
    };
  }

  public async login(data: LoginUserRequest): Promise<AuthResponse> {
    const user = await this.userRepo.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await comparePassword(data.password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    logger.info(`AuthService: User logged in ${user.id} (${user.email})`);

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      hospitalId: user.hospital_id,
      role: user.role,
    });

    return {
      user: this.mapToProfile(user),
      accessToken,
    };
  }

  public async getCurrentUser(userId: string): Promise<UserProfileResponse> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }
    return this.mapToProfile(user);
  }
}

export const authService = new AuthService();
