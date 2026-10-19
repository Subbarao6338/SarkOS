import { describe, it, expect } from "vitest";
import { createWebApp, loadApp } from "../../../src/features/apps/appLoader";
import { App } from "../../../src/features/apps/app";

describe("createWebApp", () => {
	it("creates an App instance with derived name and icon for a URL", () => {
		const url = "https://example.com/some/path";
		const app = createWebApp(url);

		expect(app).toBeInstanceOf(App);
		expect(app.name).toBe("Example");
		expect(app.id).toBe("example");
		expect(app.iconUrl).toBe("https://example.com/favicon.ico");
		expect(app.metadata?.website).toBe(url);
	});

	it("respects custom options for name, id, and iconUrl", () => {
		const url = "https://my-custom-site.org";
		const app = createWebApp(url, {
			name: "My Custom App",
			id: "my-custom-app-id",
			iconUrl: "https://my-custom-site.org/logo.png",
		});

		expect(app.name).toBe("My Custom App");
		expect(app.id).toBe("my-custom-app-id");
		expect(app.iconUrl).toBe("https://my-custom-site.org/logo.png");
	});
});

describe("loadApp", () => {
	it("falls back to creating a Web App when URL is not a module", async () => {
		const url = "https://example.org";
		const app = await loadApp(url);

		expect(app).toBeInstanceOf(App);
		expect(app.name).toBe("Example");
		expect(app.metadata?.website).toBe(url);
	});
});
