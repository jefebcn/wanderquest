import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getStorage as getAdminStorage } from "firebase-admin/storage";

let adminApp: App | null = null;

function getAdminApp(): App {
  if (adminApp) return adminApp;
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    throw new Error(
      "Missing FIREBASE_SERVICE_ACCOUNT_KEY. " +
      "Paste the raw service-account JSON into that Vercel environment variable."
    );
  }

  // Vercel stores multi-line env vars as plain strings — parse directly.
  // Fix escaped newlines in private_key that Vercel may introduce.
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  }

  adminApp = initializeApp({
    credential:    cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    databaseURL:   process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });

  return adminApp;
}

export const adminDb      = () => getAdminFirestore(getAdminApp());
export const adminAuth    = () => getAdminAuth(getAdminApp());
export const adminStorage = () => getAdminStorage(getAdminApp());
