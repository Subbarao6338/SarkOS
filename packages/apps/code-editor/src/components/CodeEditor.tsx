import { Editor, EditorProps, OnChange } from "@monaco-editor/react";
import { ClickAction, Divider, DropdownAction, HeaderMenu, ModalProps, ToggleAction, useSystemManager, useVirtualRoot, useWindowedModal, VirtualFile, WindowProps } from "@prozilla-os/core";
import styles from "./CodeEditor.module.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FileSelectorMode, fileExplorer } from "@prozilla-os/file-explorer";
import { extensionToLanguage } from "../core/_utils/editor.utils";

export interface CodeEditorProps extends WindowProps {
	file?: VirtualFile;
	path?: string;
}

export function CodeEditor({ file, path, close, setTitle, app }: CodeEditorProps) {
	const virtualRoot = useVirtualRoot();
	const { windowsConfig, modalsConfig } = useSystemManager();
	const [currentFile, setCurrentFile] = useState<VirtualFile | null>(file ?? null);
	const [originalContent, setOriginalContent] = useState<string | null>(file?.content ?? "");
	const [content, setContent] = useState(file?.content ?? "");
	const [unsavedChanges, setUnsavedChanges] = useState(file == null);
	const { openWindowedModal } = useWindowedModal();
	const [lineNumbersEnabled, setLineNumbersEnabled] = useState(true);
	const [minimapEnabled, setMinimapEnabled] = useState(true);
	const [markdownPreviewEnabled, setMarkdownPreviewEnabled] = useState(false);

	const openFile = useCallback((newFile: VirtualFile) => {
		void newFile.read().then((newContent) => {
			setCurrentFile(newFile);
			setContent(newContent ?? "");
			setOriginalContent(newContent ?? null);
			setUnsavedChanges(newContent === undefined);
			if (newFile.extension === "md" || newFile.extension === "markdown") {
				setMarkdownPreviewEnabled(true);
			}
		});
	}, []);

	useEffect(() => {
		if (file) {
			openFile(file);
		} else if (path) {
			const newFile = virtualRoot?.navigateToFile(path) ?? null;
			if (newFile)
				openFile(newFile);
		}
	}, [file, path, virtualRoot, openFile]);

	useEffect(() => {
		let label = currentFile?.id ?? "Untitled";

		if (unsavedChanges)
			label += "*";

		setTitle?.(app != null ? `${label} ${windowsConfig.titleSeparator} ${app.name}` : label);
	}, [currentFile, setTitle, unsavedChanges, app, windowsConfig.titleSeparator]);

	const onChange: OnChange = useCallback((value) => {
		setUnsavedChanges(originalContent !== value);
		setContent(value ?? "");
	}, [originalContent]);

	const openNewFile = useCallback(() => {
		setCurrentFile(null);
		setContent("");
		setOriginalContent(null);
		setUnsavedChanges(true);
	}, []);

	const saveFile = useCallback(() => {
		if (currentFile) {
			currentFile.setContent(content);
			openFile(currentFile);
		}
	}, [content, currentFile, openFile]);

	const openFileSelector = useCallback(() => {
		openWindowedModal({
			size: modalsConfig.defaultFileSelectorSize,
			Modal: (props: ModalProps) => <fileExplorer.WindowContent
				selectorMode={FileSelectorMode.Single}
				path={currentFile?.parent?.absolutePath}
				onSelectionFinish={({ files, directory }) => {
					const newFile = files?.length ? directory?.navigateToFile(files[0]) : null; 
					if (newFile)
						openFile(newFile);
					props.modal?.close();
				}}
				{...props}
			/>,
		});
	}, [currentFile?.parent?.absolutePath, modalsConfig.defaultFileSelectorSize, openFile, openWindowedModal]);

	const options = useMemo((): EditorProps["options"] => ({
		lineNumbers: lineNumbersEnabled ? "on" : "off",
		minimap: {
			enabled: minimapEnabled,
		},
	}), [lineNumbersEnabled, minimapEnabled]);

	const isMarkdown = currentFile?.extension === "md" || currentFile?.extension === "markdown" || markdownPreviewEnabled;

	const sanitizeAndFormatMarkdown = (raw: string) => {
		const escaped = raw
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");

		return escaped
			.replace(/^### (.*$)/gim, "<h3>$1</h3>")
			.replace(/^## (.*$)/gim, "<h2>$1</h2>")
			.replace(/^# (.*$)/gim, "<h1>$1</h1>")
			.replace(/\*\*(.*)\*\*/gim, "<b>$1</b>")
			.replace(/\*(.*)\*/gim, "<i>$1</i>")
			.replace(/\n/g, "<br/>");
	};

	return <div className={styles.CodeEditor} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
		<HeaderMenu>
			<DropdownAction label="File" showOnHover={false}>
				<ClickAction label="New" onTrigger={openNewFile} shortcut={["Control", "e"]}/>
				<ClickAction label="Open" onTrigger={openFileSelector} shortcut={["Control", "o"]}/>
				<Divider/>
				<ClickAction label="Save" onTrigger={saveFile} shortcut={["Control", "s"]}/>
				<Divider/>
				<ClickAction label="Exit" onTrigger={close} shortcut={["Control", "q"]}/>
			</DropdownAction>
			<DropdownAction label="View" showOnHover={false}>
				<DropdownAction label="Appearance">
					<ToggleAction label="Show line numbers" initialValue={lineNumbersEnabled} onTrigger={() => setLineNumbersEnabled((value) => !value)}/>
					<ToggleAction label="Show minimap" initialValue={minimapEnabled} onTrigger={() => setMinimapEnabled((value) => !value)}/>
					<ToggleAction label="Live Markdown Preview" initialValue={markdownPreviewEnabled} onTrigger={() => setMarkdownPreviewEnabled((value) => !value)}/>
				</DropdownAction>
			</DropdownAction>
		</HeaderMenu>
		<div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
			<div style={{ flex: isMarkdown && markdownPreviewEnabled ? 1 : "1 1 100%", height: "100%" }}>
				<Editor
					theme="vs-dark"
					onChange={onChange}
					value={content}
					language={extensionToLanguage(currentFile?.extension)}
					options={options}
				/>
			</div>
			{isMarkdown && markdownPreviewEnabled && (
				<div
					style={{
						flex: 1,
						height: "100%",
						backgroundColor: "#1e1e1e",
						color: "#d4d4d4",
						padding: "16px",
						overflowY: "auto",
						borderLeft: "1px solid #333",
						fontFamily: "system-ui, sans-serif"
					}}
				>
					<h3 style={{ marginTop: 0, borderBottom: "1px solid #444", paddingBottom: "8px" }}>Live Markdown Preview</h3>
					<div
						dangerouslySetInnerHTML={{
							__html: sanitizeAndFormatMarkdown(content)
						}}
					/>
				</div>
			)}
		</div>
	</div>;
}