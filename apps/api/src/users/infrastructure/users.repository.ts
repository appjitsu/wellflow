import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { users } from '../../database/schemas/users';
import type { UsersRepository, UserRecord } from '../domain/users.repository';
import type { NewUser } from '../../database/schema';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class UsersRepositoryImpl implements UsersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(data: NewUser): Promise<UserRecord> {
    const db = this.databaseService.getDb();
    const result = await db
      .insert(users)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0] as UserRecord;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const db = this.databaseService.getDb();
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return result?.[0] ? (result[0] as UserRecord) : null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const db = this.databaseService.getDb();
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return result?.[0] ? (result[0] as UserRecord) : null;
  }

  async findAll(): Promise<UserRecord[]> {
    const db = this.databaseService.getDb();
    return await db.select().from(users);
  }

  async update(id: string, data: Partial<NewUser>): Promise<UserRecord | null> {
    const db = this.databaseService.getDb();
    const result = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return result?.[0] ? (result[0] as UserRecord) : null;
  }

  async delete(id: string): Promise<boolean> {
    const db = this.databaseService.getDb();
    const result = await db.delete(users).where(eq(users.id, id));

    return (result.rowCount ?? 0) > 0;
  }
}
