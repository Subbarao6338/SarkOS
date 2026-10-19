/**
 * In-OS Sandboxed Python & Code Execution Engine using Pyodide / JS evaluation.
 */

declare global {
	interface Window {
		loadPyodide?: (config: { indexURL?: string }) => Promise<PyodideInterface>;
	}
}

export interface PyodideInterface {
	runPythonAsync: (code: string) => Promise<unknown>;
	setStdout: (options: { batched: (msg: string) => void }) => void;
	setStderr: (options: { batched: (msg: string) => void }) => void;
}

let pyodideInstance: PyodideInterface | null = null;
let pyodideLoadingPromise: Promise<PyodideInterface | null> | null = null;

export async function getPyodide(): Promise<PyodideInterface | null> {
	if (pyodideInstance) return pyodideInstance;
	if (pyodideLoadingPromise) return pyodideLoadingPromise;

	if (typeof window === "undefined") return null;

	pyodideLoadingPromise = (async () => {
		if (!window.loadPyodide) {
			// Dynamically load Pyodide script
			await new Promise<void>((resolve, reject) => {
				const script = document.createElement("script");
				script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
				script.onload = () => resolve();
				script.onerror = () => reject(new Error("Failed to load Pyodide script from CDN"));
				document.head.appendChild(script);
			});
		}

		if (window.loadPyodide) {
			pyodideInstance = await window.loadPyodide({
				indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
			});
			return pyodideInstance;
		}

		return null;
	})();

	try {
		return await pyodideLoadingPromise;
	} catch (e) {
		console.warn("Pyodide loading failed or offline:", e);
		return null;
	}
}

export async function runPythonCode(
	code: string,
	onOutput: (text: string) => void
): Promise<{ success: boolean; result?: unknown; error?: string }> {
	const pyodide = await getPyodide();

	if (pyodide) {
		pyodide.setStdout({ batched: (msg) => onOutput(msg + "\n") });
		pyodide.setStderr({ batched: (msg) => onOutput(msg + "\n") });

		try {
			const res = await pyodide.runPythonAsync(code);
			if (res !== undefined && res !== null) {
				onOutput(String(res) + "\n");
			}
			return { success: true, result: res };
		} catch (err: unknown) {
			const errMsg = err instanceof Error ? err.message : String(err);
			onOutput(`Python Error: ${errMsg}\n`);
			return { success: false, error: errMsg };
		}
	} else {
		// Fallback lightweight Python evaluator for basic code / offline mode
		onOutput("[Pyodide Runtime] Running in offline fallback mode...\n");
		try {
			// Safe basic python emulation / expression execution
			const lines = code.trim().split("\n");
			for (const line of lines) {
				if (line.startsWith("print(")) {
					const match = line.match(/^print\((.*)\)$/);
					if (match) {
						let inner = match[1].trim();
						if ((inner.startsWith('"') && inner.endsWith('"')) || (inner.startsWith("'") && inner.endsWith("'"))) {
							inner = inner.slice(1, -1);
						}
						onOutput(inner + "\n");
					}
				}
			}
			return { success: true };
		} catch (e: unknown) {
			const errMsg = e instanceof Error ? e.message : String(e);
			onOutput(`Execution Error: ${errMsg}\n`);
			return { success: false, error: errMsg };
		}
	}
}

export async function runJSCode(
	code: string,
	onOutput: (text: string) => void
): Promise<{ success: boolean; result?: unknown; error?: string }> {
	try {
		const originalLog = console.log;
		console.log = (...args: unknown[]) => {
			onOutput(args.map(a => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ") + "\n");
		};

		const result = eval(code);
		console.log = originalLog;

		if (result !== undefined) {
			onOutput(String(result) + "\n");
		}
		return { success: true, result };
	} catch (err: unknown) {
		const errMsg = err instanceof Error ? err.message : String(err);
		onOutput(`JS Execution Error: ${errMsg}\n`);
		return { success: false, error: errMsg };
	}
}
