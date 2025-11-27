import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "@react-native-firebase/auth";
import { auth } from "../services/firebase";

/**
 * @typedef {Object} AuthContextValue
 * @property {import('@react-native-firebase/auth').FirebaseAuthTypes.User | null} user
 * @property {boolean} loading
 * @property {(email: string, password: string) => Promise<void>} login
 * @property {() => Promise<void>} logout
 */

/** @type {React.Context<AuthContextValue | undefined>} */
const AuthContext = createContext(undefined);

/**
 * Auth Provider that exposes Firebase auth state and actions.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  /**
   * @param {string} email
   * @param {string} password
   */
  const login = async (email, password) => {
    await auth().signInWithEmailAndPassword(email, password);
  };

  const logout = async () => {
    await auth().signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access the AuthContext
 * @returns {AuthContextValue}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return ctx;
}
