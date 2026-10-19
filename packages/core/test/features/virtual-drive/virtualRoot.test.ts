import { assert, expect } from "vitest";
import { VirtualDriveConfig, VirtualRoot } from "../../../src/features";
import { MockSystemManager } from "../system/system.utils";
import { MockVirtualRoot } from "./virtualDrive.utils";
import { test } from "../..";

let mockVirtualRoot: VirtualRoot | null = null;

test.beforeEach(() => {
	const mockSystemManager = new MockSystemManager();
	mockVirtualRoot = new MockVirtualRoot(mockSystemManager);
});

test("path", () => {
	assert(mockVirtualRoot != null);
	expect(mockVirtualRoot.path).toBe("");
});

test("displayPath", () => {
	assert(mockVirtualRoot != null);
	expect(mockVirtualRoot.displayPath).toBe("/");
});

test("getRoot()", () => {
	assert(mockVirtualRoot != null);
	expect(mockVirtualRoot.getRoot()).toBe(mockVirtualRoot);
});

test("isFile()", () => {
	assert(mockVirtualRoot != null);
	expect(mockVirtualRoot.isFile()).toBe(false);
});

test("isFolder()", () => {
	assert(mockVirtualRoot != null);
	expect(mockVirtualRoot.isFolder()).toBe(true);
});

test("VirtualDriveConfig enables compression by default", () => {
	const config = new VirtualDriveConfig();
	expect(config.saveData).toEqual({
		enableCompression: true,
		prefix: "pos-",
		migrations: [["data", "drive"]],
	});
});