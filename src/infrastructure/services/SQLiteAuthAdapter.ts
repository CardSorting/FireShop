/**
 * [LAYER: INFRASTRUCTURE]
 * SQLite Implementation of Auth Provider
 */
import { Kysely } from 'kysely';
import bcrypt from 'bcryptjs';
import { getSQLiteDB } from '../sqlite/database';
import type { Database } from '../sqlite/schema';
import type { IAuthProvider } from '@domain/repositories';
import type { User, UserRole } from '@domain/models';

function toUserRole(role: string): UserRole {
  return role === 'admin' ? 'admin' : 'customer';
}

export class SQLiteAuthAdapter implements IAuthProvider {
  private db: Kysely<Database>;
  private currentUser: User | null = null;
  private authListeners: ((user: User | null) => void)[] = [];

  constructor() {
    this.db = getSQLiteDB();
  }

  async getCurrentUser(): Promise<User | null> {
    return this.currentUser;
  }

  async signIn(email: string, password: string): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();
    const userRow = await this.db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', normalizedEmail)
      .executeTakeFirst();

    if (!userRow) {
      throw new Error('Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, userRow.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const user: User = {
      id: userRow.id,
      email: userRow.email,
      displayName: userRow.displayName,
      role: toUserRole(userRow.role),
      createdAt: new Date(userRow.createdAt),
    };

    this.setCurrentUser(user);
    return user;
  }

  async signUp(email: string, password: string, displayName: string): Promise<User> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const normalizedEmail = email.trim().toLowerCase();

    const passwordHash = await bcrypt.hash(password, 10);

    try {
      await this.db
        .insertInto('users')
        .values({
          id,
          email: normalizedEmail,
          passwordHash,
          displayName: displayName.trim(),
          role: 'customer',
          createdAt: now,
        })
        .execute();
    } catch {
      throw new Error('Unable to create account with those credentials');
    }

    const user: User = {
      id,
      email: normalizedEmail,
      displayName: displayName.trim(),
      role: 'customer',
      createdAt: new Date(now),
    };

    this.setCurrentUser(user);
    return user;
  }

  async signOut(): Promise<void> {
    this.setCurrentUser(null);
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    this.authListeners.push(callback);
    callback(this.currentUser);

    return () => {
      this.authListeners = this.authListeners.filter(l => l !== callback);
    };
  }

  async getAllUsers(): Promise<User[]> {
    const users = await this.db
      .selectFrom('users')
      .selectAll()
      .execute();

    return users.map(u => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      role: toUserRole(u.role),
      createdAt: new Date(u.createdAt),
    }));
  }

  private setCurrentUser(user: User | null) {
    this.currentUser = user;
    this.authListeners.forEach(l => l(user));
  }
}

