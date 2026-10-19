import { Storage } from "../storage/storage";
import { IndexedDBStorage, globalIndexedDB } from "../storage/indexedDBStorage";
import { VirtualDriveConfig } from "../system/configs";

export class VirtualDriveStorage extends Storage {
	virtualDriveConfig: VirtualDriveConfig;
	idbStorage: IndexedDBStorage;

	static readonly KEY = "drive";

	constructor(virtualDriveConfig: VirtualDriveConfig) {
		super();
		this.virtualDriveConfig = virtualDriveConfig;
		this.idbStorage = globalIndexedDB;
		this.synchronize();

		// Migrate old unused keys
		if (this.virtualDriveConfig.saveData) {
			this.virtualDriveConfig.saveData.migrations?.forEach(([oldKey, newKey]) => this.rename(oldKey, newKey));
		}
	}

	override load(key: string): string | null {
		this.synchronize();
		return super.load(key);
	}

	override store(key: string, value: string) {
		this.synchronize();
		super.store(key, value);
		// Asynchronously persist to IndexedDB for high-capacity backup
		this.idbStorage.setItem(key, value).catch(() => {});
	}

	async loadAsync(key: string): Promise<string | null> {
		this.synchronize();
		const syncVal = super.load(key);
		if (syncVal) return syncVal;

		const idbVal = await this.idbStorage.getItem<string>(key);
		return idbVal ?? null;
	}

	async storeAsync(key: string, value: string): Promise<void> {
		this.store(key, value);
		await this.idbStorage.setItem(key, value);
	}

	synchronize() {
		if (!this.virtualDriveConfig.saveData)
			return;
		this.enableCompression = this.virtualDriveConfig.saveData.enableCompression;
		this.prefix = this.virtualDriveConfig.saveData.prefix;
	}

}