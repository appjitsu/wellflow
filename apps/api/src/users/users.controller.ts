import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import type { NewUser } from '../database/schema';
import { RATE_LIMIT_TIERS } from '../common/throttler';

const ERROR_MESSAGES = {
  USER_NOT_FOUND: 'User not found',
} as const;

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Throttle({ [RATE_LIMIT_TIERS.STRICT]: { limit: 30, ttl: 60000 } })
  async createUser(@Body() userData: NewUser) {
    try {
      return await this.usersService.createUser(userData);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create user';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  @Throttle({ [RATE_LIMIT_TIERS.DEFAULT]: { limit: 60, ttl: 60000 } })
  async getAllUsers() {
    try {
      return await this.usersService.getAllUsers();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch users';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    try {
      const user = await this.usersService.getUserById(id);
      if (!user) {
        throw new HttpException(
          ERROR_MESSAGES.USER_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }
      return user;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('email/:email')
  async getUserByEmail(@Param('email') email: string) {
    try {
      const user = await this.usersService.getUserByEmail(email);
      if (!user) {
        throw new HttpException(
          ERROR_MESSAGES.USER_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }
      return user;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() userData: Partial<NewUser>,
  ) {
    try {
      const user = await this.usersService.updateUser(id, userData);
      if (!user) {
        throw new HttpException(
          ERROR_MESSAGES.USER_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }
      return user;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    try {
      const deleted = await this.usersService.deleteUser(id);
      if (!deleted) {
        throw new HttpException(
          ERROR_MESSAGES.USER_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }
      return { message: 'User deleted successfully' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to delete user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
