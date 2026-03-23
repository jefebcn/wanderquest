"use client";

import { useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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

  const updateUserProfile = async (data: { displayName?: string; photoFile?: File }) => {
    const { auth, db, storage } = getFirebaseClient();
    const u = auth.currentUser;
    if (!u) throw new Error("Utente non autenticato");

    const authUpdates: { displayName?: string; photoURL?: string } = {};
    const dbUpdates: Record<string, string> = {};

    if (data.displayName !== undefined && data.displayName.trim()) {
      authUpdates.displayName = data.displayName.trim();
      dbUpdates.displayName   = data.displayName.trim();
    }

    if (data.photoFile) {
      const storageRef = ref(storage, `avatars/${u.uid}`);
      await uploadBytes(storageRef, data.photoFile);
      const url = await getDownloadURL(storageRef);
      authUpdates.photoURL = url;
      dbUpdates.photoURL   = url;
    }

    if (Object.keys(authUpdates).length > 0) {
      await updateProfile(u, authUpdates);
    }
    if (Object.keys(dbUpdates).length > 0) {
      await updateDoc(doc(db, "users", u.uid), dbUpdates);
    }

    await u.reload();
    setUser(auth.currentUser);
  };

  return { user, loading, signInWithGoogle, signInWithEmail, registerWithEmail, logout, updateUserProfile };
}
