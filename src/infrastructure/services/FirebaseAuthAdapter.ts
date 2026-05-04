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
} from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection, updateDoc, Timestamp } from 'firebase/firestore';
import { getAuth, getDb } from '../firebase/firebase';
import type { IAuthProvider } from '@domain/repositories';
import type { User, UserRole } from '@domain/models';

export class FirebaseAuthAdapter implements IAuthProvider {
  private currentUser: User | null = null;
  private authListeners: ((user: User | null) => void)[] = [];

  constructor() {
    firebaseOnAuthStateChanged(getAuth(), async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch additional data from Firestore
        const userDoc = await getDoc(doc(getDb(), 'users', firebaseUser.uid));
        const userData = userDoc.data();
        
        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || userData?.displayName || 'User',
          role: (userData?.role as UserRole) || 'customer',
          createdAt: userData?.createdAt ? (userData.createdAt instanceof Timestamp ? userData.createdAt.toDate() : new Date(userData.createdAt)) : new Date(),
        };
        this.setCurrentUser(user);
      } else {
        this.setCurrentUser(null);
      }
    });
  }

  async getCurrentUser(): Promise<User | null> {
    return this.currentUser;
  }

  async signIn(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(getAuth(), email, password);
    const firebaseUser = userCredential.user;
    
    const userDoc = await getDoc(doc(getDb(), 'users', firebaseUser.uid));
    const userData = userDoc.data();
    
    const user: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || userData?.displayName || 'User',
      role: (userData?.role as UserRole) || 'customer',
      createdAt: userData?.createdAt ? (userData.createdAt instanceof Timestamp ? userData.createdAt.toDate() : new Date(userData.createdAt)) : new Date(),
    };
    
    this.setCurrentUser(user);
    return user;
  }

  async signInWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(getAuth(), provider);
    const firebaseUser = userCredential.user;
    
    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(getDb(), 'users', firebaseUser.uid));
    let user: User;
    
    if (!userDoc.exists()) {
      user = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'User',
        role: 'customer',
        createdAt: new Date(),
      };
      
      await setDoc(doc(getDb(), 'users', firebaseUser.uid), {
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        createdAt: Timestamp.now(),
      });
    } else {
      const userData = userDoc.data();
      user = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || userData?.displayName || 'User',
        role: (userData?.role as UserRole) || 'customer',
        createdAt: userData?.createdAt ? (userData.createdAt instanceof Timestamp ? userData.createdAt.toDate() : new Date(userData.createdAt)) : new Date(),
      };
    }
    
    this.setCurrentUser(user);
    return user;
  }

  async signUp(email: string, password: string, displayName: string): Promise<User> {
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
    
    // Save additional data to Firestore
    await setDoc(doc(getDb(), 'users', firebaseUser.uid), {
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      createdAt: Timestamp.now(),
    });
    
    this.setCurrentUser(user);
    return user;
  }

  async signOut(): Promise<void> {
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
    const snapshot = await getDocs(collection(getDb(), 'users'));
    return snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        email: data.email,
        displayName: data.displayName,
        role: data.role as UserRole,
        notes: data.notes,
        metadata: data.metadata,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
      };
    });
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const firestoreUpdates: any = { ...updates };
    if (updates.metadata) {
      // In Firestore we can store objects directly, no need for JSON.stringify if not needed
    }
    
    await updateDoc(doc(getDb(), 'users', id), firestoreUpdates);
    
    const userDoc = await getDoc(doc(getDb(), 'users', id));
    const data = userDoc.data()!;
    
    return {
      id: id,
      email: data.email,
      displayName: data.displayName,
      role: data.role as UserRole,
      notes: data.notes,
      metadata: data.metadata,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    };
  }

  private setCurrentUser(user: User | null) {
    this.currentUser = user;
    this.authListeners.forEach(l => l(user));
  }
}
