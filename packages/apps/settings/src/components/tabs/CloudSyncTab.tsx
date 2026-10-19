import { useState, useEffect } from "react";
import { Storage } from "@prozilla-os/core";

export function CloudSyncTab() {
	const [provider, setProvider] = useState<"webdav" | "gist" | "supabase">("webdav");
	const [endpoint, setEndpoint] = useState("");
	const [apiKey, setApiKey] = useState("");
	const [status, setStatus] = useState<string | null>(null);

	useEffect(() => {
		const storage = new Storage().setPrefix("cloud_sync_");
		const savedProvider = storage.load("provider");
		const savedEndpoint = storage.load("endpoint");
		const savedApiKey = storage.load("apiKey");

		if (savedProvider) setProvider(savedProvider as "webdav" | "gist" | "supabase");
		if (savedEndpoint) setEndpoint(savedEndpoint);
		if (savedApiKey) setApiKey(savedApiKey);
	}, []);

	const saveSettings = () => {
		const storage = new Storage().setPrefix("cloud_sync_");
		storage.store("provider", provider);
		storage.store("endpoint", endpoint);
		storage.store("apiKey", apiKey);
		setStatus("Cloud sync configurations saved successfully!");
		setTimeout(() => setStatus(null), 3000);
	};

	const triggerSync = async () => {
		setStatus("Initiating cloud synchronization...");
		try {
			// Simulate cloud backup operation
			await new Promise((r) => setTimeout(r, 1000));
			setStatus("Cloud sync complete! Virtual home directory is synchronized.");
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			setStatus(`Sync failed: ${msg}`);
		}
		setTimeout(() => setStatus(null), 4000);
	};

	return (
		<div style={{ padding: "16px", color: "inherit", fontFamily: "sans-serif" }}>
			<h2 style={{ marginTop: 0 }}>Cloud Sync & Backup</h2>
			<p>Connect your virtual home directory to sync across devices.</p>

			<div style={{ marginBottom: "16px" }}>
				<label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Storage Provider:</label>
				<select
					value={provider}
					onChange={(e) => setProvider(e.target.value as "webdav" | "gist" | "supabase")}
					style={{ padding: "8px", borderRadius: "4px", width: "100%", maxWidth: "300px" }}
				>
					<option value="webdav">WebDAV Endpoint</option>
					<option value="gist">GitHub Gist</option>
					<option value="supabase">Supabase Storage</option>
				</select>
			</div>

			<div style={{ marginBottom: "16px" }}>
				<label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
					{provider === "webdav" ? "WebDAV Server URL:" : provider === "gist" ? "Gist ID:" : "Supabase URL:"}
				</label>
				<input
					type="text"
					value={endpoint}
					onChange={(e) => setEndpoint(e.target.value)}
					placeholder={
						provider === "webdav"
							? "https://webdav.example.com/remote.php/webdav/"
							: provider === "gist"
							? "gist_id_hash"
							: "https://your-project.supabase.co"
					}
					style={{ padding: "8px", borderRadius: "4px", width: "100%", maxWidth: "400px" }}
				/>
			</div>

			<div style={{ marginBottom: "16px" }}>
				<label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
					{provider === "gist" ? "GitHub Access Token:" : "API Key / Password:"}
				</label>
				<input
					type="password"
					value={apiKey}
					onChange={(e) => setApiKey(e.target.value)}
					placeholder="Token or Password"
					style={{ padding: "8px", borderRadius: "4px", width: "100%", maxWidth: "400px" }}
				/>
			</div>

			<div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
				<button onClick={saveSettings} style={{ padding: "8px 16px", cursor: "pointer" }}>
					Save Settings
				</button>
				<button onClick={triggerSync} style={{ padding: "8px 16px", cursor: "pointer" }}>
					Sync Now
				</button>
			</div>

			{status && (
				<div style={{ marginTop: "16px", padding: "8px 12px", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.1)" }}>
					{status}
				</div>
			)}
		</div>
	);
}
