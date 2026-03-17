"use client";

import { useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase/client";

export function useAuth() {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { auth } = getFirebaseClient();
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);

      // Bootstrap user profile on first sign-in
      if (u) {
        const { db } = getFirebaseClient();
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, {
            uid:         u.uid,
            email:       u.email ?? "",
            displayName: u.displayName ?? u.email?.split("@")[0] ?? "Esploratore",
            photoURL:    u.photoURL ?? null,
            plan:        "free",
            totalPoints: 0,
            totalVisits: 0,
            createdAt:   serverTimestamp(),
          });
        }
      }
    });
    return unsub;
  }, []);

  const signInWithGoogle = async () => {
    const { auth } = getFirebaseClient();
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { auth } = getFirebaseClient();
    await signInWithEmailAndPassword(auth, email, password);
  };

  const registerWithEmail = async (email: string, password: string) => {
    const { auth } = getFirebaseClient();
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    const { auth } = getFirebaseClient();
    await signOut(auth);
  };

  return { user, loading, signInWithGoogle, signInWithEmail, registerWithEmail, logout };
}
