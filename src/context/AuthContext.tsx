"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { User } from "firebase/auth";
import {
  subscribeToAuth,
  loginWithGoogle as fbLoginWithGoogle,
  logoutUser as fbLogoutUser,
  checkRedirectResult,
  fetchFoodLogsFromCloud,
  batchUploadFoodLogsToCloud,
  deleteFoodLogFromCloud,
  fetchUserSettingsFromCloud,
  saveUserSettingsToCloud,
} from "@/lib/firebase";
import {
  getFoodLogs,
  saveFoodLogs,
  getUserSettings,
  saveUserSettings,
  getDeletedLogIds,
  clearDeletedLogIds,
} from "@/lib/storage";
import { FoodLogItem } from "@/types";

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSyncing: boolean;
  syncStatus: SyncStatus;
  lastSyncTime: Date | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const isSyncingRef = useRef(false);

  // Smart two-way merge between LocalStorage and Firestore
  const performSync = useCallback(async (currentUser: User) => {
    if (!currentUser || isSyncingRef.current) return;
    isSyncingRef.current = true;
    setIsSyncing(true);
    setSyncStatus("syncing");

    try {
      // 0. Purge any pending deleted items tracked offline
      const deletedIds = getDeletedLogIds();
      if (deletedIds.length > 0) {
        await Promise.all(
          deletedIds.map((id) =>
            deleteFoodLogFromCloud(currentUser.uid, id).catch((e) =>
              console.warn("[sync] Failed to purge deleted log:", e)
            )
          )
        );
        clearDeletedLogIds(deletedIds);
      }
      const deletedSet = new Set(deletedIds);

      const localLogs = getFoodLogs();
      const rawCloudLogs = await fetchFoodLogsFromCloud(currentUser.uid);
      const cloudLogs = rawCloudLogs.filter((item) => !deletedSet.has(item.id));

      // Create maps for quick lookup
      const localMap = new Map<string, FoodLogItem>();
      localLogs.forEach((it) => {
        if (!deletedSet.has(it.id)) {
          localMap.set(it.id, it);
        }
      });

      const cloudMap = new Map<string, FoodLogItem>();
      cloudLogs.forEach((it) => cloudMap.set(it.id, it));

      const itemsToUpload: FoodLogItem[] = [];
      const mergedList: FoodLogItem[] = [];

      // 1. Check local logs: if not in cloud, queue for upload
      localLogs.forEach((localItem) => {
        if (deletedSet.has(localItem.id)) return;
        if (!cloudMap.has(localItem.id)) {
          itemsToUpload.push(localItem);
          mergedList.push(localItem);
        } else {
          // Exists in both: keep local version to preserve micro thumbnail if any
          const cloudItem = cloudMap.get(localItem.id)!;
          mergedList.push({
            ...cloudItem,
            thumbnail: localItem.thumbnail || cloudItem.thumbnail,
          });
        }
      });

      // 2. Check cloud logs: if not in local, add to merged list
      cloudLogs.forEach((cloudItem) => {
        if (!localMap.has(cloudItem.id) && !deletedSet.has(cloudItem.id)) {
          mergedList.push(cloudItem);
        }
      });

      // 3. Sort chronologically (newest first)
      mergedList.sort((a, b) => b.createdAt - a.createdAt);

      // Save merged logs back to local storage
      saveFoodLogs(mergedList);

      // Upload missing local logs to cloud
      if (itemsToUpload.length > 0) {
        await batchUploadFoodLogsToCloud(currentUser.uid, itemsToUpload);
      }

      // Sync user settings (BMR / daily goals / personal Gemini API key)
      const cloudSettings = await fetchUserSettingsFromCloud(currentUser.uid);
      const localSettings = getUserSettings();

      if (cloudSettings) {
        // Merge cloud goals and Gemini API key with local
        const mergedSettings = {
          daily_goal: cloudSettings.daily_goal || localSettings.daily_goal,
          protein_goal_g: cloudSettings.protein_goal_g || localSettings.protein_goal_g,
          carbs_goal_g: cloudSettings.carbs_goal_g || localSettings.carbs_goal_g,
          fat_goal_g: cloudSettings.fat_goal_g || localSettings.fat_goal_g,
          gemini_api_key: cloudSettings.gemini_api_key || localSettings.gemini_api_key,
          storage_mode: cloudSettings.storage_mode || localSettings.storage_mode,
        };
        saveUserSettings(mergedSettings);

        // If local had a gemini key but cloud didn't have one yet, upload it now
        if (localSettings.gemini_api_key && !cloudSettings.gemini_api_key) {
          await saveUserSettingsToCloud(currentUser.uid, {
            ...cloudSettings,
            ...mergedSettings,
          });
        }
      } else {
        // Upload local settings to cloud
        await saveUserSettingsToCloud(currentUser.uid, localSettings);
      }

      setSyncStatus("synced");
      setLastSyncTime(new Date());

      // Dispatch custom window event so open pages refresh immediately
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("calcal_data_synced"));
      }
    } catch (err) {
      console.error("[auth] Sync failed:", err);
      setSyncStatus("error");
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    // Check if coming back from redirect login (e.g. mobile)
    checkRedirectResult()
      .then(async (redirectUser) => {
        if (redirectUser) {
          setUser(redirectUser);
          await performSync(redirectUser);
        }
      })
      .catch((err) => console.warn("[auth] Redirect error:", err));

    const unsubscribe = subscribeToAuth(async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Auto sync upon user login
        await performSync(currentUser);
      } else {
        setSyncStatus("idle");
      }
    });

    return () => unsubscribe();
  }, [performSync]);

  const loginWithGoogle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const loggedUser = await fbLoginWithGoogle();
      if (loggedUser) {
        setUser(loggedUser);
        await performSync(loggedUser);
      }
    } catch (err: any) {
      console.error("[auth] Google login error:", err);
      if (err?.code === "auth/unauthorized-domain") {
        const domain =
          typeof window !== "undefined" ? window.location.hostname : "";
        alert(
          `⚠️ โดเมน "${domain}" ยังไม่ได้รับอนุญาตใน Firebase Authentication\n\nวิธีเปิดให้ใช้งานได้ (ทำเพียงครั้งเดียว):\n1. ไปที่ Firebase Console > Authentication > Settings\n2. เลื่อนลงมาที่หัวข้อ "Authorized domains"\n3. กดปุ่ม "Add domain" แล้วใส่: ${domain}\n4. กดบันทึก แล้วกลับมากดล็อกอินใหม่อีกครั้งครับ`
        );
      } else if (
        err?.code === "auth/popup-closed-by-user" ||
        err?.code === "auth/cancelled-popup-request"
      ) {
        // User cancelled, closed popup, or second tap superseded: silently ignore
      } else {
        alert(err?.message || "ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fbLogoutUser();
      setUser(null);
      setSyncStatus("idle");
    } catch (err) {
      console.error("[auth] Logout error:", err);
    }
  };

  const syncNow = async () => {
    if (user) {
      await performSync(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isSyncing,
        syncStatus,
        lastSyncTime,
        loginWithGoogle,
        logout,
        syncNow,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
