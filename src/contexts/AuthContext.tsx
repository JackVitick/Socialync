
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  type User as FirebaseUser,
  type AuthError
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';
import type { z } from 'zod';
import type { loginSchema, signupSchema } from '@/lib/authSchemas';

type User = FirebaseUser | null;

interface AuthContextType {
  user: User;
  loadingAuth: boolean;
  signUpWithEmail: (values: z.infer<typeof signupSchema>) => Promise<void>;
  signInWithEmail: (values: z.infer<typeof loginSchema>) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const signUpWithEmail = async (values: z.infer<typeof signupSchema>) => {
    try {
      setLoadingAuth(true);
      await createUserWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: "Success", description: "Account created successfully! You are now logged in." });
    } catch (error) {
      const authError = error as AuthError;
      console.error("Signup error:", authError);
      toast({ title: "Signup Failed", description: authError.message || "An unknown error occurred.", variant: "destructive" });
    } finally {
      setLoadingAuth(false);
    }
  };

  const signInWithEmail = async (values: z.infer<typeof loginSchema>) => {
    try {
      setLoadingAuth(true);
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: "Success", description: "Logged in successfully!" });
    } catch (error) {
      const authError = error as AuthError;
      console.error("Login error:", authError);
      toast({ title: "Login Failed", description: authError.message || "Invalid credentials or network issue.", variant: "destructive" });
    } finally {
      setLoadingAuth(false);
    }
  };

  const signOutUser = async () => {
    try {
      setLoadingAuth(true);
      await signOut(auth);
      toast({ title: "Success", description: "Logged out successfully." });
    } catch (error) {
      const authError = error as AuthError;
      console.error("Logout error:", authError);
      toast({ title: "Logout Failed", description: authError.message || "An unknown error occurred.", variant: "destructive" });
    } finally {
      setLoadingAuth(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loadingAuth, signUpWithEmail, signInWithEmail, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
