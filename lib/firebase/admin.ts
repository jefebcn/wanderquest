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

  // Prefer a single base64-encoded service account JSON (set in Vercel as
  // FIREBASE_SERVICE_ACCOUNT_KEY).  Fall back to individual fields.
  let serviceAccount: object;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, "base64").toString("utf8")
      );
    } catch {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY is set but could not be decoded / parsed as JSON. " +
        "Encode the service-account file with: openssl base64 -in key.json | tr -d '\\n'"
      );
    }
  } else if (process.env.FIREBASE_PROJECT_ID) {
    serviceAccount = {
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
    };
  } else {
    throw new Error(
      "Firebase Admin credentials not found. " +
      "Set FIREBASE_SERVICE_ACCOUNT_KEY (base64 JSON) or " +
      "FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY."
    );
  }

  adminApp = initializeApp({
    credential:    cert(serviceAccount as Parameters<typeof cert>[0]),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    databaseURL:   process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });

  return adminApp;
}

export const adminDb      = () => getAdminFirestore(getAdminApp());
export const adminAuth    = () => getAdminAuth(getAdminApp());
export const adminStorage = () => getAdminStorage(getAdminApp());
