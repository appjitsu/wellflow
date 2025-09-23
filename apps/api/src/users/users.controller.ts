import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { z } from 'zod';
import { UsersService } from './users.service';
import type { NewUser } from '../database/schema';
import { RATE_LIMIT_TIERS } from '../common/throttler';
import { ValidationService } from '../common/validation/validation.service';
import { JwtAuthGuard } from '../presentation/guards/jwt-auth.guard';
import { AbilitiesGuard } from '../authorization/abilities.guard';
import {
  CanCreateUser,
  CanReadUser,
  CanUpdateUser,
  CanDeleteUser,
} from '../authorization/abilities.decorator';
import { AuditLog } from '../presentation/decorators/audit-log.decorator';

// Zod validation schemas
const createUserSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  email: z.string().email('Invalid email format').max(255),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  role: z.enum(['owner', 'manager', 'pumper']),
  phone: z.string().max(20).optional(),
  isActive: z.boolean().optional(),
});

const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').max(255).optional(),
  firstName: z.string().min(1, 'First name is required').max(100).optional(),
  lastName: z.string().min(1, 'Last name is required').max(100).optional(),
  role: z.enum(['owner', 'manager', 'pumper']).optional(),
  phone: z.string().max(20).optional(),
  isActive: z.boolean().optional(),
});

type CreateUserDto = z.infer<typeof createUserSchema>;
type UpdateUserDto = z.infer<typeof updateUserSchema>;

// Common API response descriptions
const API_RESPONSES: Record<string, string> = {
  INVALID_INPUT: 'Invalid input data',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  TOO_MANY_REQUESTS: 'Too many requests',
  NOT_FOUND: 'Resource not found',
  INTERNAL_ERROR: 'Internal server error',
} as const;

const USER_NOT_FOUND = 'User not found';

/**
 * Users Controller
 * Handles HTTP requests for user management with CASL authorization
 */
@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly validationService: ValidationService,
  ) {}

  @Post()
  @CanCreateUser()
  @Throttle({ [RATE_LIMIT_TIERS.STRICT]: { limit: 30, ttl: 60000 } })
  @AuditLog({ action: 'CREATE_USER' })
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: API_RESPONSES.INVALID_INPUT,
  })
  async createUser(@Body() dto: CreateUserDto) {
    const validatedDto = this.validationService.validate(createUserSchema, dto);

    const userData: NewUser = {
      ...validatedDto,
      organizationId: validatedDto.organizationId,
    };

    return await this.usersService.createUser(userData);
  }

  @Get()
  @CanReadUser()
  @Throttle({ [RATE_LIMIT_TIERS.DEFAULT]: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
  })
  async getAllUsers() {
    return await this.usersService.getAllUsers();
  }

  @Get(':id')
  @CanReadUser()
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User found',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: USER_NOT_FOUND,
  })
  async getUserById(@Param('id') id: string) {
    const user = await this.usersService.getUserById(id);
    if (!user) {
      throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return user;
  }

  @Get('email/:email')
  @CanReadUser()
  @ApiOperation({ summary: 'Get user by email' })
  @ApiParam({ name: 'email', description: 'User email' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User found',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: USER_NOT_FOUND,
  })
  async getUserByEmail(@Param('email') email: string) {
    const user = await this.usersService.getUserByEmail(email);
    if (!user) {
      throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return user;
  }

  @Put(':id')
  @CanUpdateUser()
  @AuditLog({ action: 'UPDATE_USER' })
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: USER_NOT_FOUND,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: API_RESPONSES.INVALID_INPUT,
  })
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const validatedDto = this.validationService.validate(updateUserSchema, dto);

    const user = await this.usersService.updateUser(id, validatedDto);
    if (!user) {
      throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return user;
  }

  @Delete(':id')
  @CanDeleteUser()
  @AuditLog({ action: 'DELETE_USER' })
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: USER_NOT_FOUND,
  })
  async deleteUser(@Param('id') id: string) {
    const deleted = await this.usersService.deleteUser(id);
    if (!deleted) {
      throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return { message: 'User deleted successfully' };
  }
}
