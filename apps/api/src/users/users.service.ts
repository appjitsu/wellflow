import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { users, User, NewUser } from '../database/schema';

@Injectable()
export class UsersService {
  constructor(
    private databaseService: DatabaseService,
    private redisService: RedisService,
  ) {}

  async createUser(userData: NewUser): Promise<User> {
    const db = this.databaseService.getDb();

    const [newUser] = await db.insert(users).values(userData).returning();

    if (!newUser) {
      throw new Error('Failed to create user');
    }

    // Cache the user in Redis for 1 hour
    await this.redisService.set(
      `user:${newUser.id}`,
      JSON.stringify(newUser),
      3600,
    );

    return newUser;
  }

  async getUserById(id: number): Promise<User | null> {
    // Try to get from cache first
    const cached = await this.redisService.get(`user:${id}`);
    if (cached) {
      return JSON.parse(cached) as User;
    }

    // If not in cache, get from database
    const db = this.databaseService.getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (user) {
      // Cache the user for 1 hour
      await this.redisService.set(`user:${id}`, JSON.stringify(user), 3600);
    }

    return user || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const cacheKey = `user:email:${email}`;

    // Try to get from cache first
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as User;
    }

    // If not in cache, get from database
    const db = this.databaseService.getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user) {
      // Cache the user for 1 hour
      await this.redisService.set(cacheKey, JSON.stringify(user), 3600);
    }

    return user || null;
  }

  async getAllUsers(): Promise<User[]> {
    const db = this.databaseService.getDb();
    return await db.select().from(users);
  }

  async updateUser(
    id: number,
    userData: Partial<NewUser>,
  ): Promise<User | null> {
    const db = this.databaseService.getDb();

    const [updatedUser] = await db
      .update(users)
      .set({ ...userData })
      .where(eq(users.id, id))
      .returning();

    if (updatedUser) {
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
    }

    return updatedUser || null;
  }

  async deleteUser(id: number): Promise<boolean> {
    const db = this.databaseService.getDb();

    // Get user first to clear email cache
    const user = await this.getUserById(id);

    const result = await db.delete(users).where(eq(users.id, id));

    if (result.rowCount && result.rowCount > 0) {
      // Clear cache
      await this.redisService.del(`user:${id}`);
      if (user) {
        await this.redisService.del(`user:email:${user.email}`);
      }
      return true;
    }

    return false;
  }
}
