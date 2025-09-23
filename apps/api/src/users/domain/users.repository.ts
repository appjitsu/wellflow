import { NewUser } from '../../database/schema';

export interface UserRecord {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  organizationId: string | null;
  role: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsersRepository {
  create(data: NewUser): Promise<UserRecord>;
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findAll(): Promise<UserRecord[]>;
  update(id: string, data: Partial<NewUser>): Promise<UserRecord | null>;
  delete(id: string): Promise<boolean>;
}
