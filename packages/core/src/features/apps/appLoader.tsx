import { App } from "./app";
import type { WindowProps } from "../../components";
import { WebView } from "../../components/_utils/web-view/WebView";
import { isValidUrl, Vector2 } from "@prozilla-os/shared";

export interface LoadAppOptions {
	/**
	 * The name of the export that contains the App instance.
	 * If not specified, checks `app` first, then `default`.
	 */
	exportName?: string;
	/**
	 * Optional custom name for web apps created from URLs.
	 */
	name?: string;
	/**
	 * Optional custom icon URL for web apps.
	 */
	iconUrl?: string;
}

export interface WebAppOptions {
	name?: string;
	iconUrl?: string;
	id?: string;
	size?: Vector2;
}

const SHARED_DEPS = ["@prozilla-os/core", "@prozilla-os/shared", "react", "react/jsx-runtime", "react-dom"];

function npmToUrl(packageName: string) {
	const external = SHARED_DEPS.map(encodeURIComponent).join(",");
	return `https://esm.sh/${packageName}?external=${external}`;
}

function extractApp(module: Record<string, unknown>, exportName?: string): App<WindowProps> | null {
	if (exportName != null) {
		const value = module[exportName];
		if (value instanceof App)
			return value;
		return null;
	}

	const appValue = module["app"];
	if (appValue instanceof App)
		return appValue;

	const defaultVal = module["default"];
	if (defaultVal instanceof App)
		return defaultVal;

	return null;
}

/**
 * Derives a clean app name from a URL if none provided.
 */
function deriveNameFromUrl(url: string): string {
	try {
		const parsed = new URL(url);
		let hostname = parsed.hostname.replace(/^www\./, "");
		if (!hostname) return "Web App";
		const nameParts = hostname.split(".");
		const mainDomain = nameParts.length > 1 ? nameParts[nameParts.length - 2] : nameParts[0];
		return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
	} catch {
		return "Web App";
	}
}

/**
 * Derives a favicon URL from a site URL.
 */
function deriveIconFromUrl(url: string): string {
	try {
		const parsed = new URL(url);
		return `${parsed.origin}/favicon.ico`;
	} catch {
		return "https://os.prozilla.dev/assets/apps/icons/browser.svg";
	}
}

/**
 * Create an App instance that loads a web page inside a WebView iframe.
 */
export function createWebApp(url: string, options?: WebAppOptions): App<WindowProps> {
	const name = options?.name ?? deriveNameFromUrl(url);
	const rawId = options?.id ?? name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
	const id = rawId || "web-app";
	const iconUrl = options?.iconUrl ?? deriveIconFromUrl(url);
	const size = options?.size ?? new Vector2(800, 600);

	const WebAppContent = ({ focus }: WindowProps) => {
		return <WebView source={url} title={name} focus={focus} />;
	};

	const app = new App(name, id, WebAppContent, { size })
		.setIconUrl(iconUrl)
		.setCategory("Utilities & tools")
		.setMetadata({
			website: url,
		});

	return app;
}

/**
 * Load an app from a URL using dynamic import, falling back to createWebApp if loading fails.
 */
async function loadAppFromUrl(url: string, options?: LoadAppOptions) {
	try {
		const module = await import(/* @vite-ignore */ url) as Record<string, unknown>;
		const app = extractApp(module, options?.exportName);

		if (app != null)
			return app;
	} catch {
		// Module load failed; proceed to fallback web app creation if valid URL
	}

	if (isValidUrl(url)) {
		return createWebApp(url, {
			name: options?.name,
			iconUrl: options?.iconUrl,
		});
	}

	throw new Error(`Failed to load app from URL or module: ${url}`);
}

/**
 * Load an app from either a URL or an npm package name (auto-detected).
 */
export async function loadApp(appNameOrUrl: string, options?: LoadAppOptions) {
	const isUrl = isValidUrl(appNameOrUrl);
	const url = isUrl ? appNameOrUrl : npmToUrl(appNameOrUrl);

	if (isUrl) {
		return loadAppFromUrl(url, options);
	} else {
		try {
			return await loadAppFromUrl(url, options);
		} catch (error) {
			throw new Error(`Failed to load npm package "${appNameOrUrl}": ${error instanceof Error ? error.message : String(error)}`);
		}
	}
}
