import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../services/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * @typedef {Object} AuthContextValue
 * @property {import('@react-native-firebase/auth').FirebaseAuthTypes.User | null} user
 * @property {string | null} token
 * @property {boolean} loading
 * @property {(email: string, password: string) => Promise<void>} login
 * @property {() => Promise<void>}onInitApp
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
      setLoading(false);

      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          await AsyncStorage.setItem("token", idToken);
        } else {
          setToken(null);
          setUser(null);
          await AsyncStorage.removeItem("token");
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
    await AsyncStorage.setItem("email", email);
    await AsyncStorage.setItem("password", password);

    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await auth.signOut();

    await AsyncStorage.removeItem("email");
    await AsyncStorage.removeItem("password");
  };

  const onInitApp = async () => {
    const email = await AsyncStorage.getItem("email");
    const password = await AsyncStorage.getItem("password");

    if (email && password) {
      console.log({ email, password });
      await login(email, password);
    } else {
      throw "aqui";
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, token, onInitApp }}
    >
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
