import { describe, expect } from "vitest";
import { Skin } from "../../src/core";
import { Theme } from "../../src/types";
import { test } from "..";

const DEFAULT_BASE_URL = "https://os.prozilla.dev/";

describe("Skin", () => {
	test.simpleCases(Skin.assetUrl, [
		["/asset/test.svg", "{base}/asset/test.svg"],
		["asset/test.svg", "{base}asset/test.svg"],
		["https://os.prozilla.dev/asset/test.svg", "https://os.prozilla.dev/asset/test.svg"],
	]);

	test("Theme enum contains all themes including Expressive and Light themes", () => {
		expect(Theme.Dark).toBe(0);
		expect(Theme.Light).toBe(1);
		expect(Theme.Cherry).toBe(2);
		expect(Theme.Mango).toBe(3);
		expect(Theme.Aqua).toBe(4);
		expect(Theme.Grape).toBe(5);
		expect(Theme.Expressive).toBe(6);
		expect(Theme.ExpressiveLight).toBe(7);
		expect(Theme.CherryLight).toBe(8);
		expect(Theme.MangoLight).toBe(9);
		expect(Theme.AquaLight).toBe(10);
		expect(Theme.GrapeLight).toBe(11);
	});

	test("with default options has default base URL", () => {
		const skin = new Skin();
		expect(skin.baseUrl).toBe(DEFAULT_BASE_URL);
	});

	describe(`with default options resolves assets to ${DEFAULT_BASE_URL}`, () => {
		const skin = new Skin();

		test.each([
			...skin.wallpapers,
			skin.defaultWallpaper,
			skin.systemIcon,
			...Object.values(skin.fileIcons),
			...Object.values(skin.folderIcons),
		])(`%s starts with ${DEFAULT_BASE_URL}`, (assetUrl) => {
			expect(assetUrl.startsWith(DEFAULT_BASE_URL)).toBe(true);
		});
	});

	describe("resolves assets with custom base URL", () => {
		const baseUrl = "https://example.com/";
		const skin = new Skin({ baseUrl });

		test.each([
			...skin.wallpapers,
			skin.defaultWallpaper,
			skin.systemIcon,
			...Object.values(skin.fileIcons),
			...Object.values(skin.folderIcons),
		])(`%s starts with ${baseUrl}`, (assetUrl) => {
			expect(assetUrl.startsWith(baseUrl)).toBe(true);
		});
	});

	describe("resolves assets without base URL ending in '/'", () => {
		const baseUrl = "https://example.com/";
		const skin = new Skin({
			baseUrl: baseUrl.slice(0, -1),
			systemIcon: "{base}assets/system-icon.svg",
		});

		test.each([
			...skin.wallpapers,
			skin.defaultWallpaper,
			skin.systemIcon,
			...Object.values(skin.fileIcons),
			...Object.values(skin.folderIcons),
		])(`%s starts with ${baseUrl}`, (assetUrl) => {
			expect(assetUrl.startsWith(baseUrl)).toBe(true);
		});
	});
});