/**
 * Asynchronous IndexedDB storage manager for high-capacity file buffers,
 * Wasm database storage, and persistent OS state.
 */
export class IndexedDBStorage {
	private dbName: string;
	private storeName: string;
	private dbPromise: Promise<IDBDatabase> | null = null;

	constructor(dbName = "prozilla_os_vfs", storeName = "files") {
		this.dbName = dbName;
		this.storeName = storeName;
	}

	private getDB(): Promise<IDBDatabase> {
		if (this.dbPromise) return this.dbPromise;

		this.dbPromise = new Promise((resolve, reject) => {
			if (typeof indexedDB === "undefined") {
				reject(new Error("IndexedDB is not supported in this environment"));
				return;
			}

			const request = indexedDB.open(this.dbName, 1);

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains(this.storeName)) {
					db.createObjectStore(this.storeName);
				}
			};

			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});

		return this.dbPromise;
	}

	async setItem(key: string, value: unknown): Promise<void> {
		try {
			const db = await this.getDB();
			return new Promise((resolve, reject) => {
				const tx = db.transaction(this.storeName, "readwrite");
				const store = tx.objectStore(this.storeName);
				const req = store.put(value, key);
				req.onsuccess = () => resolve();
				req.onerror = () => reject(req.error);
			});
		} catch {
			// Fallback to localStorage if IDB fails or unavailable
			try {
				localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
			} catch (e) {
				console.error("Failed to store in IndexedDB and localStorage", e);
			}
		}
	}

	async getItem<T = unknown>(key: string): Promise<T | null> {
		try {
			const db = await this.getDB();
			return new Promise((resolve, reject) => {
				const tx = db.transaction(this.storeName, "readonly");
				const store = tx.objectStore(this.storeName);
				const req = store.get(key);
				req.onsuccess = () => resolve((req.result as T) ?? null);
				req.onerror = () => reject(req.error);
			});
		} catch {
			const item = localStorage.getItem(key);
			if (!item) return null;
			try {
				return JSON.parse(item) as T;
			} catch {
				return item as unknown as T;
			}
		}
	}

	async removeItem(key: string): Promise<void> {
		try {
			const db = await this.getDB();
			return new Promise((resolve, reject) => {
				const tx = db.transaction(this.storeName, "readwrite");
				const store = tx.objectStore(this.storeName);
				const req = store.delete(key);
				req.onsuccess = () => resolve();
				req.onerror = () => reject(req.error);
			});
		} catch {
			localStorage.removeItem(key);
		}
	}

	async clear(): Promise<void> {
		try {
			const db = await this.getDB();
			return new Promise((resolve, reject) => {
				const tx = db.transaction(this.storeName, "readwrite");
				const store = tx.objectStore(this.storeName);
				const req = store.clear();
				req.onsuccess = () => resolve();
				req.onerror = () => reject(req.error);
			});
		} catch {
			localStorage.clear();
		}
	}

	async getAllKeys(): Promise<string[]> {
		try {
			const db = await this.getDB();
			return new Promise((resolve, reject) => {
				const tx = db.transaction(this.storeName, "readonly");
				const store = tx.objectStore(this.storeName);
				const req = store.getAllKeys();
				req.onsuccess = () => resolve((req.result as string[]) || []);
				req.onerror = () => reject(req.error);
			});
		} catch {
			return Object.keys(localStorage);
		}
	}
}

export const globalIndexedDB = new IndexedDBStorage();
