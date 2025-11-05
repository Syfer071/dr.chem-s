// IndexedDB setup for DR.CHEM'S
const DB_NAME = 'dr_chems_db';
const DB_VERSION = 1;

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

export interface Chemical {
  id: number;
  name: string;
  brand: string;
  quantity: number;
  unit: string;
  location: string;
  purchaseDate: string;
  expiryDate: string;
  minLimit: number;
  condition: 'normal' | 'used' | 'broken';
  notes: string;
}

export interface Equipment {
  id: number;
  name: string;
  brand: string;
  quantity: number;
  location: string;
  purchaseDate: string;
  condition: 'normal' | 'broken';
  notes: string;
}

export interface BrokenItem {
  id: number;
  type: 'chemical' | 'equipment';
  name: string;
  quantity: number;
  cause: string;
  reportedBy: string;
  date: string;
  remarks: string;
}

export interface UsageLog {
  id: number;
  itemType: 'chemical' | 'equipment';
  itemId: number;
  itemName: string;
  quantityUsed: number;
  usedBy: string;
  purpose: string;
  date: string;
}

export interface Reminder {
  id: number;
  type: 'low_stock' | 'expiry' | 'broken';
  message: string;
  date: string;
  resolved: boolean;
  itemId?: number;
}

export interface ScheduleEntry {
  id: number;
  day: number; // 0-5 for 6 days
  period: number; // 0-7 for 8 periods
  className: string;
  experiment: string;
}

class Database {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stores
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('chemicals')) {
          const chemStore = db.createObjectStore('chemicals', { keyPath: 'id', autoIncrement: true });
          chemStore.createIndex('condition', 'condition', { unique: false });
        }
        if (!db.objectStoreNames.contains('equipment')) {
          const eqStore = db.createObjectStore('equipment', { keyPath: 'id', autoIncrement: true });
          eqStore.createIndex('condition', 'condition', { unique: false });
        }
        if (!db.objectStoreNames.contains('brokenItems')) {
          db.createObjectStore('brokenItems', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('usageLogs')) {
          db.createObjectStore('usageLogs', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('reminders')) {
          const remStore = db.createObjectStore('reminders', { keyPath: 'id', autoIncrement: true });
          remStore.createIndex('resolved', 'resolved', { unique: false });
        }
        if (!db.objectStoreNames.contains('schedule')) {
          db.createObjectStore('schedule', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  async add<T>(storeName: string, data: Omit<T, 'id'>): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('Database not initialized');
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('Database not initialized');
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(storeName: string, id: number): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('Database not initialized');
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error);
    });
  }

  async update<T>(storeName: string, data: T): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('Database not initialized');
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('Database not initialized');
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('Database not initialized');
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new Database();
