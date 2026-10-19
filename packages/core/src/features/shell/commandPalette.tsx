import React, { useState, useEffect, useCallback } from "react";
import { useSystemManager, useWindowsManager, useVirtualRoot } from "../../hooks";
import { VirtualFolder } from "../virtual-drive";

export function CommandPalette() {
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);

	const { appsConfig } = useSystemManager();
	const windowsManager = useWindowsManager();
	const virtualRoot = useVirtualRoot();

	const toggleOpen = useCallback(() => {
		setIsOpen((prev) => !prev);
		setQuery("");
		setSelectedIndex(0);
	}, []);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && (e.key === " " || e.key === "k" || e.key === "K")) {
				e.preventDefault();
				toggleOpen();
			} else if (e.key === "Escape" && isOpen) {
				e.preventDefault();
				setIsOpen(false);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, toggleOpen]);

	if (!isOpen) return null;

	const apps = appsConfig.apps.filter((app) =>
		app.name.toLowerCase().includes(query.toLowerCase())
	);

	const files: { name: string; path: string }[] = [];
	if (virtualRoot && query.length > 0) {
		const searchFolder = (folder: VirtualFolder) => {
			folder.files.forEach((f) => {
				if (f.name.toLowerCase().includes(query.toLowerCase())) {
					files.push({ name: f.name, path: f.absolutePath });
				}
			});
			folder.subFolders.forEach((sub) => searchFolder(sub as VirtualFolder));
		};
		searchFolder(virtualRoot as VirtualFolder);
	}

	const results = [
		...apps.map((a) => ({ type: "app" as const, id: a.id, title: `App: ${a.name}`, action: () => windowsManager?.open(a.id) })),
		...files.slice(0, 5).map((f) => ({ type: "file" as const, id: f.path, title: `File: ${f.name} (${f.path})`, action: () => {} }))
	];

	const handleExecute = (index: number) => {
		const item = results[index];
		if (item) {
			item.action();
			setIsOpen(false);
		}
	};

	return (
		<div
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				backgroundColor: "rgba(0,0,0,0.5)",
				zIndex: 999999,
				display: "flex",
				justifyContent: "center",
				alignItems: "flex-start",
				paddingTop: "15vh"
			}}
			onClick={() => setIsOpen(false)}
		>
			<div
				style={{
					width: "600px",
					maxWidth: "90vw",
					backgroundColor: "#1e1e2e",
					color: "#cdd6f4",
					borderRadius: "8px",
					boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
					overflow: "hidden",
					border: "1px solid #45475a"
				}}
				onClick={(e) => e.stopPropagation()}
			>
				<input
					autoFocus
					type="text"
					value={query}
					onChange={(e) => {
						setQuery(e.target.value);
						setSelectedIndex(0);
					}}
					onKeyDown={(e) => {
						if (e.key === "ArrowDown") {
							e.preventDefault();
							setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length));
						} else if (e.key === "ArrowUp") {
							e.preventDefault();
							setSelectedIndex((prev) => (prev - 1 + results.length) % Math.max(1, results.length));
						} else if (e.key === "Enter") {
							e.preventDefault();
							handleExecute(selectedIndex);
						}
					}}
					placeholder="Search apps, files, or execute commands... (Ctrl+Space / Cmd+K)"
					style={{
						width: "100%",
						padding: "16px",
						fontSize: "18px",
						border: "none",
						outline: "none",
						backgroundColor: "transparent",
						color: "#cdd6f4",
						borderBottom: "1px solid #45475a"
					}}
				/>
				<div style={{ maxHeight: "300px", overflowY: "auto" }}>
					{results.map((item, idx) => (
						<div
							key={item.id + idx}
							onClick={() => handleExecute(idx)}
							style={{
								padding: "12px 16px",
								cursor: "pointer",
								backgroundColor: idx === selectedIndex ? "#313244" : "transparent",
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center"
							}}
						>
							<span>{item.title}</span>
							<span style={{ fontSize: "12px", opacity: 0.6 }}>{item.type.toUpperCase()}</span>
						</div>
					))}
					{results.length === 0 && (
						<div style={{ padding: "16px", textAlign: "center", opacity: 0.6 }}>No results found</div>
					)}
				</div>
			</div>
		</div>
	);
}
