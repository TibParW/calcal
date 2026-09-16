import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
  Firestore,
} from "firebase/firestore";
import { FoodLogItem, UserSettings } from "@/types";

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyDa3bkQYQD6b7o-RIgMUqAr4_B_UZKjJBQ",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "calcal-app-3c703.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "calcal-app-3c703",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "calcal-app-3c703.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "244055459965",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:244055459965:web:42928a37ed8e9c13800914",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-K836DDE5TD",
};

// Singleton initialization
export const app: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

/**
 * Sign in with Google (Popup)
 */
export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign in as Anonymous guest
 */
export async function loginAnonymously(): Promise<User> {
  const result = await signInAnonymously(auth);
  return result.user;
}

/**
 * Sign out
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Listen to auth state changes
 */
export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/* =========================================================================
 * Cloud Firestore Food Logs Synchronization
 * Collection path: users/{userId}/food_logs/{logId}
 * ========================================================================= */

/**
 * Save or update a single food log item to Firestore
 */
export async function saveFoodLogToCloud(
  userId: string,
  item: FoodLogItem
): Promise<boolean> {
  if (!userId) return false;
  try {
    const docRef = doc(db, "users", userId, "food_logs", item.id);
    // Don't sync large image data to Firestore free tier to save quota
    const { thumbnail, ...cleanItem } = item;
    await setDoc(docRef, cleanItem, { merge: true });
    return true;
  } catch (err) {
    console.warn("[firebase] Failed to save log to cloud:", err);
    return false;
  }
}

/**
 * Delete a food log item from Firestore
 */
export async function deleteFoodLogFromCloud(
  userId: string,
  id: string
): Promise<boolean> {
  if (!userId) return false;
  try {
    const docRef = doc(db, "users", userId, "food_logs", id);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.warn("[firebase] Failed to delete log from cloud:", err);
    return false;
  }
}

/**
 * Fetch all food logs for this user from Firestore
 */
export async function fetchFoodLogsFromCloud(
  userId: string
): Promise<FoodLogItem[]> {
  if (!userId) return [];
  try {
    const logsCol = collection(db, "users", userId, "food_logs");
    const snapshot = await getDocs(logsCol);
    const cloudLogs: FoodLogItem[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as FoodLogItem;
      cloudLogs.push(data);
    });
    return cloudLogs;
  } catch (err) {
    console.warn("[firebase] Failed to fetch logs from cloud:", err);
    return [];
  }
}

/**
 * Batch upload local logs to Firestore (e.g. on first login or sync)
 */
export async function batchUploadFoodLogsToCloud(
  userId: string,
  items: FoodLogItem[]
): Promise<number> {
  if (!userId || items.length === 0) return 0;
  try {
    // Firestore batch limit is 500 operations per batch
    const batches = [];
    let currentBatch = writeBatch(db);
    let countInCurrent = 0;
    let totalUploaded = 0;

    for (const item of items) {
      const docRef = doc(db, "users", userId, "food_logs", item.id);
      const { thumbnail, ...cleanItem } = item;
      currentBatch.set(docRef, cleanItem, { merge: true });
      countInCurrent++;
      totalUploaded++;

      if (countInCurrent >= 400) {
        batches.push(currentBatch.commit());
        currentBatch = writeBatch(db);
        countInCurrent = 0;
      }
    }

    if (countInCurrent > 0) {
      batches.push(currentBatch.commit());
    }

    await Promise.all(batches);
    return totalUploaded;
  } catch (err) {
    console.warn("[firebase] Failed to batch upload logs:", err);
    return 0;
  }
}

/* =========================================================================
 * Cloud Firestore User Settings Synchronization
 * Collection path: users/{userId}/settings/profile
 * ========================================================================= */

export async function saveUserSettingsToCloud(
  userId: string,
  settings: UserSettings
): Promise<boolean> {
  if (!userId) return false;
  try {
    const docRef = doc(db, "users", userId, "settings", "profile");
    // Exclude local Gemini API key from cloud sync if desired for privacy, or sync with consent
    const { gemini_api_key, ...safeSettings } = settings;
    await setDoc(docRef, safeSettings, { merge: true });
    return true;
  } catch (err) {
    console.warn("[firebase] Failed to save settings to cloud:", err);
    return false;
  }
}

export async function fetchUserSettingsFromCloud(
  userId: string
): Promise<UserSettings | null> {
  if (!userId) return null;
  try {
    const docRef = doc(db, "users", userId, "settings", "profile");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserSettings;
    }
    return null;
  } catch (err) {
    console.warn("[firebase] Failed to fetch settings from cloud:", err);
    return null;
  }
}
