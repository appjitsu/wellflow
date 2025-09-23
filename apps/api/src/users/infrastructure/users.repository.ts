import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';
import { users } from '../../database/schemas/users';
import type { UsersRepository, UserRecord } from '../domain/users.repository';
import type { NewUser } from '../../database/schema';

@Injectable()
export class UsersRepositoryImpl implements UsersRepository {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: NewUser): Promise<UserRecord> {
    const result = await this.db
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
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return (result[0] as UserRecord) || null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return (result[0] as UserRecord) || null;
  }

  async findAll(): Promise<UserRecord[]> {
    return await this.db.select().from(users);
  }

  async update(id: string, data: Partial<NewUser>): Promise<UserRecord | null> {
    const result = await this.db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return (result[0] as UserRecord) || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(users).where(eq(users.id, id));

    return (result.rowCount ?? 0) > 0;
  }
}
