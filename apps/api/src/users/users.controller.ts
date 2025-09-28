import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
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
import { UsersService } from './users.service';
import type { NewUser } from '../database/schema';
import { RATE_LIMIT_TIERS } from '../common/throttler';
import {
  CanCreateUser,
  CanReadUser,
  CanUpdateUser,
  CanDeleteUser,
  CheckAbilities,
} from '../authorization/abilities.decorator';
import { AuditLog } from '../presentation/decorators/audit-log.decorator';
import { UserRecord } from './domain/users.repository';
import {
  CreateUserDto,
  UpdateUserDto,
  InviteUserDto,
  AssignRoleDto,
} from './dto';

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
// Temporarily disabled for debugging
// @UseGuards(JwtAuthGuard, AbilitiesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
    const userData: NewUser = {
      organizationId: dto.organizationId,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      phone: dto.phone,
      isActive: dto.isActive ?? true,
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
  async getUserById(@Param('id') id: string): Promise<UserRecord> {
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
  async getUserByEmail(@Param('email') email: string): Promise<UserRecord> {
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
    const user = await this.usersService.updateUser(id, dto);
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

  /**
   * Role Management Endpoints
   * Only owners can assign roles within their organization
   */

  @Put(':id/role')
  @CheckAbilities({ action: 'assignRole', subject: 'User' })
  @AuditLog({ action: 'ASSIGN_USER_ROLE' })
  @ApiOperation({ summary: 'Assign role to user (Owner only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User role updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: USER_NOT_FOUND,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only owners can assign roles',
  })
  async assignUserRole(@Param('id') id: string, @Body() dto: AssignRoleDto) {
    const user = await this.usersService.updateUser(id, {
      role: dto.role,
    });

    if (!user) {
      throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    return user;
  }

  @Post('invite')
  @CheckAbilities({ action: 'inviteUser', subject: 'User' })
  @AuditLog({ action: 'INVITE_USER' })
  @ApiOperation({ summary: 'Invite new user to organization (Owner only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User invitation sent successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only owners can invite users',
  })
  async inviteUser(@Body() dto: InviteUserDto) {
    // Create user with inactive status (will be activated when they accept invitation)
    const userData: NewUser = {
      organizationId: dto.organizationId,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      isActive: false, // User must accept invitation to activate
    };

    const user = await this.usersService.createUser(userData);

    return {
      message: 'User invitation sent successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
      },
    };
  }
}
