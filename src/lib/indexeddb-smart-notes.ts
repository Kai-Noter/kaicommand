type SmartNotesSnapshot = {
  folders: any[]
  updatedAt: string
}

const DB_NAME = 'kaicommand-smart-notes'
const STORE_NAME = 'snapshots'
const KEY = 'smart-notes-v1'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment'))
      return
    }

    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'))
  })
}

export async function readSmartNotesSnapshot(): Promise<SmartNotesSnapshot | null> {
  try {
    const db = await openDb()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(KEY)
      req.onsuccess = () => resolve((req.result as SmartNotesSnapshot | undefined) ?? null)
      req.onerror = () => reject(req.error || new Error('Failed to read snapshot'))
    })
  } catch {
    return null
  }
}

export async function writeSmartNotesSnapshot(folders: any[]): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const payload: SmartNotesSnapshot = {
        folders,
        updatedAt: new Date().toISOString()
      }
      const req = store.put(payload, KEY)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error || new Error('Failed to write snapshot'))
    })
  } catch {
    // Offline cache is best-effort only.
  }
}

