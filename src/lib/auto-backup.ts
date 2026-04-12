/*
 * AlpacaLive — Auto-backup system
 * Saves data to a user-chosen folder on the phone/device.
 *
 * Strategy:
 * - Chrome/Android: File System Access API (showDirectoryPicker)
 *   → writes directly to a folder in Files/Downloads
 * - iOS/Safari: fallback to download trigger (saves to Files app)
 * - Auto-backup after each significant data change (debounced)
 * - On startup: check for backup file and offer restore
 */
import { exportAllData, importData } from './db';

// ==================== FILE SYSTEM ACCESS API ====================

// Store directory handle in IndexedDB for persistence across sessions
const DB_NAME = 'AlpacaLiveBackupConfig';
const STORE_NAME = 'config';

async function saveDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openConfigDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).put(handle, 'backupDirHandle');
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function getDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openConfigDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const handle = await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
      const req = tx.objectStore(STORE_NAME).get('backupDirHandle');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (!handle) return null;

    // Verify permission is still granted (File System Access API extensions)
    const handleExt = handle as FileSystemDirectoryHandle & {
      queryPermission(desc: { mode: string }): Promise<string>;
      requestPermission(desc: { mode: string }): Promise<string>;
    };
    const perm = await handleExt.queryPermission({ mode: 'readwrite' });
    if (perm === 'granted') return handle;

    // Try to request permission again
    const newPerm = await handleExt.requestPermission({ mode: 'readwrite' });
    return newPerm === 'granted' ? handle : null;
  } catch {
    return null;
  }
}

function openConfigDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ==================== PUBLIC API ====================

/**
 * Check if File System Access API is supported (Chrome/Edge/Android Chrome).
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * Check if auto-backup folder is configured and accessible.
 */
export async function isAutoBackupConfigured(): Promise<boolean> {
  if (!isFileSystemAccessSupported()) return false;
  const handle = await getDirectoryHandle();
  return handle !== null;
}

/**
 * Get the name of the configured backup folder.
 */
export async function getBackupFolderName(): Promise<string | null> {
  const handle = await getDirectoryHandle();
  return handle?.name || null;
}

/**
 * Let user pick a folder for auto-backup.
 * Returns the folder name or null if cancelled.
 */
export async function pickBackupFolder(): Promise<string | null> {
  if (!isFileSystemAccessSupported()) return null;

  try {
    const handle = await (window as unknown as { showDirectoryPicker: (opts?: unknown) => Promise<FileSystemDirectoryHandle> })
      .showDirectoryPicker({
        id: 'alpacalive-backup',
        mode: 'readwrite',
        startIn: 'documents',
      });

    await saveDirectoryHandle(handle);
    return handle.name;
  } catch {
    // User cancelled or permission denied
    return null;
  }
}

/**
 * Write backup file to the configured folder.
 * Returns true if successful.
 */
export async function writeBackupToFolder(): Promise<boolean> {
  const handle = await getDirectoryHandle();
  if (!handle) return false;

  try {
    const json = await exportAllData();
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toISOString().split('T')[1].replace(/:/g, '-').split('.')[0];
    const fileName = `alpacalive-backup-${date}_${time}.json`;

    // Write current backup
    const fileHandle = await handle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(json);
    await writable.close();

    // Also write a "latest" file for easy restore
    const latestHandle = await handle.getFileHandle('alpacalive-latest.json', { create: true });
    const latestWritable = await latestHandle.createWritable();
    await latestWritable.write(json);
    await latestWritable.close();

    // Clean up old backups (keep last 7)
    await cleanOldBackups(handle);

    return true;
  } catch {
    return false;
  }
}

/**
 * Read the latest backup from the configured folder.
 * Returns JSON string or null.
 */
export async function readLatestBackup(): Promise<string | null> {
  const handle = await getDirectoryHandle();
  if (!handle) return null;

  try {
    const fileHandle = await handle.getFileHandle('alpacalive-latest.json');
    const file = await fileHandle.getFile();
    return await file.text();
  } catch {
    return null;
  }
}

/**
 * Restore from the latest backup in the configured folder.
 */
export async function restoreFromBackup(): Promise<boolean> {
  const json = await readLatestBackup();
  if (!json) return false;

  try {
    await importData(json);
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove backup folder configuration.
 */
export async function removeBackupFolder(): Promise<void> {
  try {
    const db = await openConfigDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete('backupDirHandle');
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // ignore
  }
}

/**
 * Fallback: trigger a download (for iOS/Safari).
 */
export async function downloadBackup(): Promise<void> {
  const json = await exportAllData();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `alpacalive-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Get info about the latest backup in the folder.
 */
export async function getLatestBackupInfo(): Promise<{ date: string; size: string } | null> {
  const handle = await getDirectoryHandle();
  if (!handle) return null;

  try {
    const fileHandle = await handle.getFileHandle('alpacalive-latest.json');
    const file = await fileHandle.getFile();
    const sizeKB = Math.round(file.size / 1024);
    return {
      date: new Date(file.lastModified).toLocaleString(),
      size: sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`,
    };
  } catch {
    return null;
  }
}

// ==================== INTERNAL ====================

async function cleanOldBackups(handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    const backupFiles: { name: string; time: number }[] = [];

    for await (const [name, entry] of handle.entries()) {
      if (entry.kind === 'file' && name.startsWith('alpacalive-backup-') && name.endsWith('.json')) {
        const file = await (entry as FileSystemFileHandle).getFile();
        backupFiles.push({ name, time: file.lastModified });
      }
    }

    // Sort by time descending, remove all except last 7
    backupFiles.sort((a, b) => b.time - a.time);
    for (const old of backupFiles.slice(7)) {
      await handle.removeEntry(old.name);
    }
  } catch {
    // Non-fatal
  }
}
