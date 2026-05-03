/**
 * [LAYER: CORE]
 */
import type { IAuthProvider } from '@domain/repositories';
import type { User } from '@domain/models';
import { AuthError, UnauthorizedError } from '@domain/errors';
import { validateDisplayName, validateEmail, validatePassword } from '@utils/validators';

export class AuthService {
  constructor(private provider: IAuthProvider) {}

  async getCurrentUser(): Promise<User | null> {
    return this.provider.getCurrentUser();
  }

  async signIn(email: string, password: string): Promise<User> {
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) throw new AuthError(emailValidation.message);
    if (!password) throw new AuthError('Password is required');
    return this.provider.signIn(email.trim().toLowerCase(), password);
  }

  async signInWithGoogle(): Promise<User> {
    return this.provider.signInWithGoogle();
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
    return this.provider.signUp(email.trim().toLowerCase(), password, displayName.trim());
  }

  async signOut(): Promise<void> {
    return this.provider.signOut();
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return this.provider.onAuthStateChanged(callback);
  }

  async getAllUsers(): Promise<User[]> {
    if (!this.provider.getAllUsers) return [];
    return this.provider.getAllUsers();
  }
 
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    if (!this.provider.updateUser) throw new Error('User updates not supported by this provider');
    return this.provider.updateUser(id, updates);
  }


  requireAuth(user: User | null): asserts user is User {
    if (!user) throw new AuthError();
  }

  requireAdmin(user: User | null): asserts user is User & { role: 'admin' } {
    this.requireAuth(user);
    if (user.role !== 'admin') throw new UnauthorizedError();
  }
}