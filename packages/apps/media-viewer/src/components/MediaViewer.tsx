import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./MediaViewer.module.css";
import { AppsConfig, IMAGE_EXTENSIONS, VIDEO_EXTENSIONS, AUDIO_EXTENSIONS, useSystemManager, useWindowsManager, VirtualFile, WindowProps, MEDIA_EXTENSIONS } from "@prozilla-os/core";

export interface MediaViewerProps extends WindowProps {
	file?: VirtualFile;
}

export function MediaViewer({ file, close, setTitle }: MediaViewerProps) {
	const { appsConfig } = useSystemManager();
	const windowsManager = useWindowsManager();
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [scale, setScale] = useState(1);
	const [rotation, setRotation] = useState(0);
	const [processedUrl, setProcessedUrl] = useState<string | null>(null);

	useEffect(() => {
		if (file != null)
			setTitle?.(file.id);
	}, [file, setTitle]);

	useEffect(() => {
		if (file == null || file.source == null)
			return;

		if (file.extension && AUDIO_EXTENSIONS.includes(file.extension)) {
			if (audioRef.current) {
				audioRef.current.src = file.source;
				void audioRef.current.play();
			}
		}

		if (file.extension && VIDEO_EXTENSIONS.includes(file.extension)) {
			if (videoRef.current) {
				videoRef.current.src = file.source;
				void videoRef.current.play();
			}
		}

		return () => {
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current.currentTime = 0;
			}
			if (videoRef.current) {
				videoRef.current.pause();
				videoRef.current.currentTime = 0;
			}
		};
	}, [file]);

	const processImage = useCallback((targetScale: number, targetRotation: number) => {
		if (!file?.source || !IMAGE_EXTENSIONS.includes(file.extension ?? "")) return;

		const img = new Image();
		img.crossOrigin = "anonymous";
		img.src = file.source;
		img.onload = () => {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			const width = img.width * targetScale;
			const height = img.height * targetScale;

			canvas.width = targetRotation % 180 === 0 ? width : height;
			canvas.height = targetRotation % 180 === 0 ? height : width;

			ctx.translate(canvas.width / 2, canvas.height / 2);
			ctx.rotate((targetRotation * Math.PI) / 180);
			ctx.drawImage(img, -width / 2, -height / 2, width, height);

			const dataUrl = canvas.toDataURL("image/png");
			setProcessedUrl(dataUrl);
		};
	}, [file]);

	if (file == null) {
		const fileExplorerApp = appsConfig.getAppByRole(AppsConfig.APP_ROLES.fileExplorer);

		setTimeout(() => {
			if (fileExplorerApp != null)
				windowsManager?.open(fileExplorerApp.id, { path: "~/Pictures" });
			close?.();
		}, 10);
		return null;
	}

	if (file.extension == null || !MEDIA_EXTENSIONS.includes(file.extension)) {
		return <p>Invalid file format.</p>;
	}

	if (file.source == null)
		return <p>File failed to load.</p>;

	if (IMAGE_EXTENSIONS.includes(file.extension)) {
		const displaySrc = processedUrl || file.source;

		return <div className={styles.MediaViewer} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", height: "100%" }}>
			<div style={{ display: "flex", gap: "8px", padding: "8px", backgroundColor: "rgba(0,0,0,0.5)", width: "100%", justifyContent: "center" }}>
				<button onClick={() => {
					const newScale = Math.max(0.2, scale - 0.2);
					setScale(newScale);
					processImage(newScale, rotation);
				}}>Zoom Out</button>
				<button onClick={() => {
					const newScale = scale + 0.2;
					setScale(newScale);
					processImage(newScale, rotation);
				}}>Zoom In</button>
				<button onClick={() => {
					const newRot = (rotation + 90) % 360;
					setRotation(newRot);
					processImage(scale, newRot);
				}}>Rotate 90°</button>
				<button onClick={() => {
					setScale(1);
					setRotation(0);
					setProcessedUrl(null);
				}}>Reset</button>
			</div>
			<div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", width: "100%" }}>
				<img src={displaySrc} alt={file.id} draggable="false" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
			</div>
			<canvas ref={canvasRef} style={{ display: "none" }} />
		</div>;
	} else if (AUDIO_EXTENSIONS.includes(file.extension)) {
		return <div className={styles.AudioViewer}>
			<audio ref={audioRef} controls>
				<source src={file.source} type={`video/${file.extension}`}/>
				Your browser does not support audio.
			</audio> 
		</div>;
	} else if (VIDEO_EXTENSIONS.includes(file.extension)) {
		if (file.extension === "yt") {
			return <div className={styles.VideoViewer}>
				<iframe
					src={file.source.replace("watch?v=", "embed/")}
					title={file.id}
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowFullScreen
					allowTransparency={true}
				/>
			</div>;
		} else {
			return <div className={styles.VideoViewer}>
				<video ref={videoRef} controls className={styles.VideoPlayer}>
					<source src={file.source} type={`video/${file.extension}`} />
					Your browser does not support videos.
				</video>
			</div>;
		}
	}

	return <div className={styles.MediaViewer}>
		<img src={file.source} alt={file.id} draggable="false"/>
	</div>;
}