import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../services/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

/**
 * @typedef {Object} AuthContextValue
 * @property {import('@react-native-firebase/auth').FirebaseAuthTypes.User | null} user
 * @property {string | null} token
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
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      try {
        if (firebaseUser) {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
        } else {
          setToken(null);
        }
      } catch (err) {
        console.error("Falha ao buscar idToken");
      }
    });

    return unsubscribe;
  }, []);

  /**
   * @param {string} email
   * @param {string} password
   */
  const login = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, token }}>
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
