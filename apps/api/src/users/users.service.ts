import { Injectable, Inject } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import type { UserRecord, UsersRepository } from './domain/users.repository';
import type { NewUser } from '../database/schema';

@Injectable()
export class UsersService {
  constructor(
    @Inject('UsersRepository')
    private readonly usersRepository: UsersRepository,
    private readonly redisService: RedisService,
  ) {}

  async createUser(userData: NewUser) {
    const newUser = await this.usersRepository.create(userData);

    if (!newUser) {
      throw new Error('Failed to create user');
    }

    try {
      // Cache the user in Redis for 1 hour
      await this.redisService.set(
        `user:${newUser.id}`,
        JSON.stringify(newUser),
        3600,
      );
    } catch (error) {
      // Log Redis error but don't fail the operation
      console.warn('Failed to cache user in Redis:', error);
    }

    return newUser;
  }

  async getUserById(id: string) {
    // Try to get from cache first
    try {
      const cached = await this.redisService.get(`user:${id}`);
      if (cached) {
        try {
          return JSON.parse(cached) as UserRecord;
        } catch (error) {
          // Invalid cache data, continue to database
          console.warn('Invalid cached data for user:', id, error);
        }
      }
    } catch (error) {
      // Redis error, continue to database
      console.warn('Redis error for user:', id, error);
    }

    // If not in cache, get from database
    const user = await this.usersRepository.findById(id);

    if (user) {
      try {
        // Cache the user for 1 hour
        await this.redisService.set(`user:${id}`, JSON.stringify(user), 3600);
      } catch (error) {
        // Log Redis error but don't fail the operation
        console.warn('Failed to cache user in Redis:', error);
      }
    }

    return user;
  }

  async getUserByEmail(email: string) {
    const cacheKey = `user:email:${email}`;

    // Try to get from cache first
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached) as UserRecord;
        } catch (error) {
          // Invalid cache data, continue to database
          console.warn('Invalid cached data for email:', email, error);
        }
      }
    } catch (error) {
      // Redis error, continue to database
      console.warn('Redis error for email:', email, error);
    }

    // If not in cache, get from database
    const user = await this.usersRepository.findByEmail(email);

    if (user) {
      try {
        // Cache the user for 1 hour
        await this.redisService.set(cacheKey, JSON.stringify(user), 3600);
      } catch (error) {
        // Log Redis error but don't fail the operation
        console.warn('Failed to cache user by email in Redis:', error);
      }
    }

    return user;
  }

  async getAllUsers() {
    return this.usersRepository.findAll();
  }

  async updateUser(id: string, userData: Partial<NewUser>) {
    const updatedUser = await this.usersRepository.update(id, userData);

    if (updatedUser) {
      try {
        // Update cache
        await this.redisService.set(
          `user:${id}`,
          JSON.stringify(updatedUser),
          3600,
        );

        // Also update email cache if email was updated
        if (userData.email) {
          await this.redisService.del(`user:email:${userData.email}`);
          await this.redisService.set(
            `user:email:${updatedUser.email}`,
            JSON.stringify(updatedUser),
            3600,
          );
        }
      } catch (error) {
        // Log Redis error but don't fail the operation
        console.warn('Failed to update user cache in Redis:', error);
      }
    }

    return updatedUser;
  }

  async deleteUser(id: string) {
    try {
      // Get user first to clear email cache
      const user = await this.getUserById(id);

      const deleted = await this.usersRepository.delete(id);

      if (deleted) {
        // Clear cache
        await this.redisService.del(`user:${id}`);
        if (user) {
          await this.redisService.del(`user:email:${user.email}`);
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }
}
