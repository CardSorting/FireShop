/**
 * [LAYER: INFRASTRUCTURE]
 * Firebase Implementation of Auth Provider
 */
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  type User as FirebaseUser,
} from 'firebase/auth';
import { 
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  Timestamp,
  getUnifiedDb,
  serverTimestamp,
  type QueryDocumentSnapshot
} from '@infrastructure/firebase/bridge';
import { getAuth } from '../firebase/firebase';
import type { IAuthProvider } from '@domain/repositories';
import type { User, UserRole } from '@domain/models';
import { mapDoc } from '@infrastructure/repositories/firestore/utils';
import { logger } from '@utils/logger';

export class FirebaseAuthAdapter implements IAuthProvider {
  private currentUser: User | null = null;
  private authListeners: ((user: User | null) => void)[] = [];

  constructor() {
    if (typeof window === 'undefined') return;

    firebaseOnAuthStateChanged(getAuth(), async (firebaseUser) => {
      if (firebaseUser) {
        this.setCurrentUser(await this.resolveUserProfile(firebaseUser, 'authStateChanged'));
      } else {
        this.setCurrentUser(null);
      }
    });
  }

  async getCurrentUser(): Promise<User | null> {
    return this.currentUser;
  }

  async signIn(email: string, password: string): Promise<User> {
    this.assertBrowserAuth('signIn');
    const userCredential = await signInWithEmailAndPassword(getAuth(), email, password);
    const user = await this.resolveUserProfile(userCredential.user, 'signIn');
    this.setCurrentUser(user);
    return user;
  }

  async signInWithGoogle(): Promise<User> {
    this.assertBrowserAuth('signInWithGoogle');
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(getAuth(), provider);
    const firebaseUser = userCredential.user;

    let user: User;

    try {
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(getUnifiedDb(), 'users', firebaseUser.uid));

      if (!userDoc.exists()) {
        user = this.fallbackUserProfile(firebaseUser);

        await setDoc(doc(getUnifiedDb(), 'users', firebaseUser.uid), {
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          createdAt: serverTimestamp(),
        });
      } else {
        const userData = userDoc.data();
        user = mapDoc<User>(firebaseUser.uid, {
          ...userData,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || userData?.displayName || 'User',
          role: (userData?.role as UserRole) || 'customer',
        });
      }
    } catch (error) {
      logger.warn('Google sign-in profile sync failed; continuing with Firebase Auth fallback profile', {
        uid: firebaseUser.uid,
        error: error instanceof Error ? error.message : String(error),
      });
      user = this.fallbackUserProfile(firebaseUser);
    }

    this.setCurrentUser(user);
    return user;
  }

  async signUp(email: string, password: string, displayName: string): Promise<User> {
    this.assertBrowserAuth('signUp');
    const userCredential = await createUserWithEmailAndPassword(getAuth(), email, password);
    const firebaseUser = userCredential.user;
    
    await updateProfile(firebaseUser, { displayName });
    
    const user: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: displayName,
      role: 'customer',
      createdAt: new Date(),
    };
    
    try {
      // Save additional data to Firestore
      await setDoc(doc(getUnifiedDb(), 'users', firebaseUser.uid), {
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      logger.warn('Email sign-up profile sync failed; continuing with Firebase Auth fallback profile', {
        uid: firebaseUser.uid,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    
    this.setCurrentUser(user);
    return user;
  }

  async signOut(): Promise<void> {
    this.assertBrowserAuth('signOut');
    await firebaseSignOut(getAuth());
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
    const snapshot = await getDocs(collection(getUnifiedDb(), 'users'));
    return snapshot.docs.map((d: QueryDocumentSnapshot) => mapDoc<User>(d.id, d.data()));
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const firestoreUpdates: any = { 
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(doc(getUnifiedDb(), 'users', id), firestoreUpdates);
    
    const userDoc = await getDoc(doc(getUnifiedDb(), 'users', id));
    return mapDoc<User>(id, userDoc.data());
  }

  private setCurrentUser(user: User | null) {
    this.currentUser = user;
    this.authListeners.forEach(l => l(user));
  }

  private async resolveUserProfile(firebaseUser: FirebaseUser, operation: string): Promise<User> {
    try {
      const userDoc = await getDoc(doc(getUnifiedDb(), 'users', firebaseUser.uid));
      const userData = userDoc.data();

      return mapDoc<User>(firebaseUser.uid, {
        ...userData,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || userData?.displayName || 'User',
        role: (userData?.role as UserRole) || 'customer',
      });
    } catch (error) {
      logger.warn('Firestore user profile fetch failed; using Firebase Auth fallback profile', {
        operation,
        uid: firebaseUser.uid,
        error: error instanceof Error ? error.message : String(error),
      });

      return this.fallbackUserProfile(firebaseUser);
    }
  }

  private fallbackUserProfile(firebaseUser: FirebaseUser): User {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      role: 'customer',
      createdAt: new Date(),
    };
  }

  private assertBrowserAuth(operation: string) {
    if (typeof window === 'undefined') {
      throw new Error(`FirebaseAuthAdapter.${operation} cannot run on the server. Use Admin SDK session routes instead.`);
    }
  }
}
