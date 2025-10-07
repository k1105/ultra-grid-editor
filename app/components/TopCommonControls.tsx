"use client";

import {useState, useEffect} from "react";
import styles from "./EditorControls.module.css";
import {Icon} from "@iconify/react/dist/iconify.js";
import {usePixelEditor} from "../contexts/PixelEditorContext";
import {useFibonacciSpiral} from "../contexts/FibonacciSpiralContext";
import {exportToZip, exportFibonacciToZip} from "../utils/exportImport";

interface TopCommonControlsProps {
  className?: string;
  // Undo/Redo props
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  showUndoRedo?: boolean;
  // Draw Mode props
  drawMode?: "draw" | "erase" | "move";
  onDrawModeChange?: (mode: "draw" | "erase" | "move") => void;
  showDrawMode?: boolean;
  // Mode props
  currentMode?: "pixel" | "fibonacci";
}

export default function TopCommonControls({
  className,
  // Undo/Redo props
  canUndo = false,
  canRedo = false,
  onUndo = () => {},
  onRedo = () => {},
  showUndoRedo = true,
  // Draw Mode props
  drawMode = "draw",
  onDrawModeChange,
  showDrawMode = false,
  // Mode props
  currentMode = "pixel",
}: TopCommonControlsProps) {
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const pixelState = usePixelEditor().state;
  const fibonacciState = useFibonacciSpiral().state;

  // キーボードイベントの監視
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // 現在の表示モードを計算（Shiftキーが押されている場合は反転）
  const displayMode = isShiftPressed
    ? drawMode === "draw"
      ? "erase"
      : "draw"
    : drawMode;

  const handleExport = async () => {
    try {
      const fileName =
        currentMode === "pixel" ? "pixel-grid" : "fibonacci-spiral";

      if (currentMode === "pixel") {
        await exportToZip(
          {
            ...pixelState,
            backgroundImage: pixelState.backgroundImage || undefined,
          },
          fileName
        );
      } else {
        await exportFibonacciToZip(fibonacciState, fileName);
      }
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "エクスポートに失敗しました"
      );
    }
  };

  // イベント伝播を停止するハンドラー
  const handleMouseEvent = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handlePointerEvent = (e: React.PointerEvent) => {
    e.stopPropagation();
  };

  const handleTouchEvent = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className={`${styles.controls} ${className || ""}`}
      onMouseDown={handleMouseEvent}
      onClick={handleMouseEvent}
      onMouseUp={handleMouseEvent}
      onMouseMove={handleMouseEvent}
      onPointerDown={handlePointerEvent}
      onPointerUp={handlePointerEvent}
      onPointerMove={handlePointerEvent}
      onTouchStart={handleTouchEvent}
      onTouchEnd={handleTouchEvent}
      onTouchMove={handleTouchEvent}
    >
      {/* 描画モードボタン */}
      {showDrawMode && onDrawModeChange && (
        <div className={styles.toolbarContainer}>
          <div className={styles.modeButtons}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDrawModeChange("draw");
              }}
              onMouseDown={handleMouseEvent}
              className={`${styles.modeButton} ${
                displayMode === "draw" ? styles.active : ""
              }`}
            >
              <Icon icon="ic:baseline-draw" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDrawModeChange("erase");
              }}
              onMouseDown={handleMouseEvent}
              className={`${styles.modeButton} ${
                displayMode === "erase" ? styles.active : ""
              }`}
            >
              <Icon icon="fluent:eraser-24-filled" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDrawModeChange("move");
              }}
              onMouseDown={handleMouseEvent}
              className={`${styles.modeButton} ${
                displayMode === "move" ? styles.active : ""
              }`}
            >
              <Icon icon="ic:round-back-hand" />
            </button>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleExport();
            }}
            className={styles.downloadButton}
            title={`${
              currentMode === "pixel" ? "Pixel" : "Fibonacci"
            } データをダウンロード`}
          >
            <Icon icon="mdi:download" />
          </button>
        </div>
      )}

      {/* Undo/Redo Group */}
      {showUndoRedo && (
        <div className={styles.undoRedoGroup}>
          <div className={styles.undoRedoLabel}>History</div>
          <div className={styles.undoRedoButtons}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUndo();
              }}
              disabled={!canUndo}
              className={`${styles.undoButton} ${
                !canUndo ? styles.disabled : ""
              }`}
              title="Undo (Ctrl+Z / Cmd+Z)"
            >
              <Icon icon="mdi:undo" />
              Undo
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRedo();
              }}
              disabled={!canRedo}
              className={`${styles.redoButton} ${
                !canRedo ? styles.disabled : ""
              }`}
              title="Redo (Ctrl+Shift+Z / Cmd+Shift+Z)"
            >
              <Icon icon="mdi:redo" />
              Redo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
