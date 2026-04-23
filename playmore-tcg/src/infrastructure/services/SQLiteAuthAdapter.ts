/**
 * [LAYER: INFRASTRUCTURE]
 * SQLite Implementation of Auth Provider
 */
import { Kysely } from 'kysely';
import bcrypt from 'bcryptjs';
import { getSQLiteDB } from '../sqlite/database';
import type { Database } from '../sqlite/schema';
import type { IAuthProvider } from '@domain/repositories';
import type { User } from '@domain/models';

export class SQLiteAuthAdapter implements IAuthProvider {
  private db: Kysely<Database>;
  private currentUser: User | null = null;
  private authListeners: ((user: User | null) => void)[] = [];

  constructor() {
    this.db = getSQLiteDB();
    const savedUser = localStorage.getItem('pm_tcg_user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch (e) {
        localStorage.removeItem('pm_tcg_user');
      }
    }
  }

  async getCurrentUser(): Promise<User | null> {
    return this.currentUser;
  }

  async signIn(email: string, password: string): Promise<User> {
    const userRow = await this.db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email)
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
      role: userRow.role as any,
      createdAt: new Date(userRow.createdAt),
    };

    this.setCurrentUser(user);
    return user;
  }

  async signUp(email: string, password: string, displayName: string): Promise<User> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const passwordHash = await bcrypt.hash(password, 10);

    await this.db
      .insertInto('users')
      .values({
        id,
        email,
        passwordHash,
        displayName,
        role: 'customer',
        createdAt: now,
      })
      .execute();

    const user: User = {
      id,
      email,
      displayName,
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

  private setCurrentUser(user: User | null) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem('pm_tcg_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('pm_tcg_user');
    }
    this.authListeners.forEach(l => l(user));
  }
}

