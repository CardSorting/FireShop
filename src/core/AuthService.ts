/**
 * [LAYER: CORE]
 */
import type { IAuthProvider } from '@domain/repositories';
import type { User } from '@domain/models';
import { AuthError, UnauthorizedError } from '@domain/errors';
import { validateDisplayName, validateEmail, validatePassword } from '@utils/validators';

import { AuditService } from './AuditService';

export class AuthService {
  constructor(
    private provider: IAuthProvider,
    private audit: AuditService
  ) {}

  async getCurrentUser(): Promise<User | null> {
    return this.provider.getCurrentUser();
  }

  async signIn(email: string, password: string): Promise<User> {
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) throw new AuthError(emailValidation.message);
    if (!password) throw new AuthError('Password is required');
    const user = await this.provider.signIn(email.trim().toLowerCase(), password);
    
    await this.audit.record({
      userId: user.id,
      userEmail: user.email,
      action: 'auth_signin',
      targetId: user.id
    });
    
    return user;
  }

  async signInWithGoogle(): Promise<User> {
    const user = await this.provider.signInWithGoogle();
    await this.audit.record({
      userId: user.id,
      userEmail: user.email,
      action: 'auth_signin',
      targetId: user.id,
      details: { provider: 'google' }
    });
    return user;
  }

  async signUp(
    email: string,
    password: string,
    displayName: string
  ): Promise<User> {
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) throw new AuthError(emailValidation.message);
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) throw new AuthError(passwordValidation.message);
    const nameValidation = validateDisplayName(displayName);
    if (!nameValidation.valid) throw new AuthError(nameValidation.message);
    
    const user = await this.provider.signUp(email.trim().toLowerCase(), password, displayName.trim());
    await this.audit.record({
      userId: user.id,
      userEmail: user.email,
      action: 'auth_signup',
      targetId: user.id
    });
    return user;
  }

  async signOut(): Promise<void> {
    const user = await this.getCurrentUser();
    if (user) {
      await this.audit.record({
        userId: user.id,
        userEmail: user.email,
        action: 'auth_signout',
        targetId: user.id
      });
    }
    return this.provider.signOut();
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return this.provider.onAuthStateChanged(callback);
  }

  async getAllUsers(signal?: AbortSignal): Promise<User[]> {
    if (signal?.aborted) return [];
    if (!this.provider.getAllUsers) return [];
    const users = await this.provider.getAllUsers();
    if (signal?.aborted) return [];
    return users;
  }
 
  async updateUser(id: string, updates: Partial<User>, actor: { id: string, email: string }): Promise<User> {
    if (!this.provider.updateUser) throw new Error('User updates not supported by this provider');
    const user = await this.provider.updateUser(id, updates);
    
    if (updates.role) {
      await this.audit.record({
        userId: actor.id,
        userEmail: actor.email,
        action: 'staff_role_updated',
        targetId: id,
        details: { newRole: updates.role }
      });
    }
    
    return user;
  }


  requireAuth(user: User | null): asserts user is User {
    if (!user) throw new AuthError();
  }

  requireAdmin(user: User | null): asserts user is User & { role: 'admin' } {
    this.requireAuth(user);
    if (user.role !== 'admin') throw new UnauthorizedError();
  }
}