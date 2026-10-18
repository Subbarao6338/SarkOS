import { useRef, useState, useEffect, useCallback, MouseEvent } from "react";
import styles from "./Paint.module.css";
import { Button, WindowProps } from "@prozilla-os/core";

export function Paint({ active }: WindowProps) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [color, setColor] = useState("#000000");
	const [brushSize, setBrushSize] = useState(5);
	const [tool, setTool] = useState<"brush" | "eraser">("brush");

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Fill white background on initial render
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}, []);

	const startDrawing = (e: MouseEvent<HTMLCanvasElement>) => {
		if (!active) return;
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		ctx.beginPath();
		ctx.moveTo(x, y);
		setIsDrawing(true);
	};

	const draw = (e: MouseEvent<HTMLCanvasElement>) => {
		if (!isDrawing) return;
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		ctx.lineWidth = brushSize;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;

		ctx.lineTo(x, y);
		ctx.stroke();
	};

	const stopDrawing = () => {
		setIsDrawing(false);
	};

	const clearCanvas = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}, []);

	const downloadImage = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const link = document.createElement("a");
		link.download = "drawing.png";
		link.href = canvas.toDataURL("image/png");
		link.click();
	}, []);

	return (
		<div className={styles.Paint}>
			<div className={styles.Toolbar}>
				<div className={styles.ToolGroup}>
					<Button onClick={() => { setTool("brush"); }} active={tool === "brush"}>Brush</Button>
					<Button onClick={() => { setTool("eraser"); }} active={tool === "eraser"}>Eraser</Button>
				</div>
				<div className={styles.ToolGroup}>
					<label>Color:</label>
					<input
						type="color"
						value={color}
						onChange={(e) => { setColor(e.target.value); }}
						className={styles.ColorPicker}
					/>
				</div>
				<div className={styles.ToolGroup}>
					<label>Size:</label>
					<input
						type="range"
						min="1"
						max="50"
						value={brushSize}
						onChange={(e) => { setBrushSize(Number(e.target.value)); }}
						className={styles.BrushSizeInput}
					/>
					<span>{brushSize}px</span>
				</div>
				<div className={styles.ToolGroup}>
					<Button onClick={clearCanvas}>Clear</Button>
					<Button onClick={downloadImage}>Save</Button>
				</div>
			</div>
			<div className={styles.CanvasContainer}>
				<canvas
					ref={canvasRef}
					width={600}
					height={400}
					className={styles.Canvas}
					onMouseDown={startDrawing}
					onMouseMove={draw}
					onMouseUp={stopDrawing}
					onMouseLeave={stopDrawing}
				/>
			</div>
		</div>
	);
}
