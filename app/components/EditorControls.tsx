"use client";

import {useState, useCallback, useEffect} from "react";
import styles from "./EditorControls.module.css";
import {Icon} from "@iconify/react/dist/iconify.js";

// グローバル関数の型定義
declare global {
  interface Window {
    updateGridSize?: (size: number) => void;
    setDrawMode?: (mode: "draw" | "erase") => void;
    setShowGuides?: (show: boolean) => void;
    updatePixelGrid?: (newGrid: boolean[][]) => void;
    pixelEditorState?: {
      pixW: number;
      pixH: number;
      gapX: number;
      gapY: number;
      gridSize: number;
      drawMode: "draw" | "erase";
      canvasWidthPercent: number;
      canvasHeightPercent: number;
      zoom: number;
      showGuides: boolean;
    };
    resetCanvas?: () => void;
    pixelGrid?: boolean[][];
  }
}

// エクスポートデータの型定義
interface ExportData {
  version: string;
  gridInfo: {
    pixW: number;
    pixH: number;
    gapX: number;
    gapY: number;
    gridSize: number;
  };
  canvasState: {
    widthPercent: number;
    heightPercent: number;
    zoom: number;
    showGuides: boolean;
  };
  pixelData: boolean[][];
  exportDate: string;
}

interface EditorControlsProps {
  className?: string;
}

export default function EditorControls({className}: EditorControlsProps) {
  const [pixW, setPixW] = useState(20);
  const [pixH, setPixH] = useState(20);
  const [gapX, setGapX] = useState(2);
  const [gapY, setGapY] = useState(2);
  const [gridSize, setGridSize] = useState(16);
  const [drawMode, setDrawMode] = useState<"draw" | "erase">("draw");
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [exportFileName, setExportFileName] = useState("pixel-grid");

  // 最大ピクセルサイズの制限
  const MAX_PIXEL_SIZE = 40;

  // アスペクト比を計算
  const aspectRatio = pixW / pixH;

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

  // アスペクト比を変更する関数
  const handleAspectRatioChange = useCallback((ratio: number) => {
    // アスペクト比に基づいてpixWとpixHを計算
    // 最大サイズを超えないように制限
    let newPixW, newPixH;

    if (ratio >= 1) {
      // 横長の場合
      newPixW = Math.min(MAX_PIXEL_SIZE, Math.round(ratio * 20));
      newPixH = Math.round(newPixW / ratio);
    } else {
      // 縦長の場合
      newPixH = Math.min(MAX_PIXEL_SIZE, Math.round(20 / ratio));
      newPixW = Math.round(newPixH * ratio);
    }

    setPixW(newPixW);
    setPixH(newPixH);
  }, []);

  // グローバルstateを更新する関数
  const updateGlobalState = useCallback(() => {
    // 既存のキャンバスサイズパーセンテージを保持
    const existingState = window.pixelEditorState;
    const canvasWidthPercent = existingState?.canvasWidthPercent ?? 100;
    const canvasHeightPercent = existingState?.canvasHeightPercent ?? 100;

    window.pixelEditorState = {
      pixW,
      pixH,
      gapX,
      gapY,
      gridSize,
      drawMode,
      canvasWidthPercent,
      canvasHeightPercent,
      zoom: existingState?.zoom ?? 1,
      showGuides: existingState?.showGuides ?? false,
    };
  }, [pixW, pixH, gapX, gapY, gridSize, drawMode]);

  // state変更時にグローバルstateを更新
  useEffect(() => {
    updateGlobalState();
  }, [updateGlobalState]);

  // グリッドサイズ変更時の処理をメモ化
  const handleGridSizeChange = useCallback((size: number) => {
    setGridSize(size);
    if (window.updateGridSize) {
      window.updateGridSize(size);
    }
  }, []);

  // 描画モード変更ハンドラー
  const handleDrawModeChange = useCallback((mode: "draw" | "erase") => {
    setDrawMode(mode);
    if (window.setDrawMode) {
      window.setDrawMode(mode);
    }
  }, []);

  // スライダー変更ハンドラーをメモ化
  const handleGapXChange = useCallback((value: number) => setGapX(value), []);
  const handleGapYChange = useCallback((value: number) => setGapY(value), []);

  // スライダー操作開始時にガイドラインを表示
  const handleSliderStart = useCallback(() => {
    if (window.setShowGuides) {
      window.setShowGuides(true);
    }
  }, []);

  // スライダー操作終了時にガイドラインを非表示
  const handleSliderEnd = useCallback(() => {
    if (window.setShowGuides) {
      window.setShowGuides(false);
    }
  }, []);

  // エクスポート処理
  const handleExport = useCallback(() => {
    const state = window.pixelEditorState;
    const pixelGrid = window.pixelGrid;

    if (!state || !pixelGrid) {
      alert("キャンバスデータが見つかりません");
      return;
    }

    const exportData: ExportData = {
      version: "1.0.0",
      gridInfo: {
        pixW: state.pixW,
        pixH: state.pixH,
        gapX: state.gapX,
        gapY: state.gapY,
        gridSize: state.gridSize,
      },
      canvasState: {
        widthPercent: state.canvasWidthPercent,
        heightPercent: state.canvasHeightPercent,
        zoom: state.zoom,
        showGuides: state.showGuides,
      },
      pixelData: pixelGrid,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFileName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportFileName]);

  // インポート処理
  const handleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string) as ExportData;

          // バージョンチェック
          if (!data.version) {
            throw new Error("Invalid file format: missing version");
          }

          // グリッド情報を更新
          if (data.gridInfo) {
            setPixW(data.gridInfo.pixW);
            setPixH(data.gridInfo.pixH);
            setGapX(data.gridInfo.gapX);
            setGapY(data.gridInfo.gapY);
            setGridSize(data.gridInfo.gridSize);
          }

          // キャンバス状態を更新
          if (data.canvasState && window.pixelEditorState) {
            window.pixelEditorState.canvasWidthPercent =
              data.canvasState.widthPercent;
            window.pixelEditorState.canvasHeightPercent =
              data.canvasState.heightPercent;
            window.pixelEditorState.zoom = data.canvasState.zoom;
            window.pixelEditorState.showGuides = data.canvasState.showGuides;
          }

          // ピクセルデータを更新
          if (data.pixelData && window.pixelGrid) {
            // グリッドサイズを更新
            if (window.updateGridSize) {
              window.updateGridSize(data.gridInfo.gridSize);
            }

            // ピクセルデータを設定
            if (window.updatePixelGrid) {
              window.updatePixelGrid(data.pixelData);
            }
          }

          alert("ファイルの読み込みが完了しました");
        } catch (error) {
          console.error("Failed to parse JSON file:", error);
          alert("無効なファイル形式です");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  return (
    <div className={`${styles.controls} ${className || ""}`}>
      <div className={styles.modeButtons}>
        <button
          onClick={() => handleDrawModeChange("draw")}
          className={`${styles.modeButton} ${
            displayMode === "draw" ? styles.active : ""
          }`}
        >
          <Icon icon="ic:baseline-draw" />
        </button>
        <button
          onClick={() => handleDrawModeChange("erase")}
          className={`${styles.modeButton} ${
            displayMode === "erase" ? styles.active : ""
          }`}
        >
          <Icon icon="fluent:eraser-24-filled" />
        </button>
        <button
          onClick={() => {
            if (window.resetCanvas) {
              window.resetCanvas();
            }
          }}
          className={styles.resetButton}
        >
          <Icon icon="mdi:refresh" />
        </button>
      </div>

      {/* Export/Import Group */}
      <div className={styles.exportImportGroup}>
        <div className={styles.exportImportLabel}>Export/Import</div>
        <div className={styles.fileNameInput}>
          <label>
            File Name
            <input
              type="text"
              value={exportFileName}
              onChange={(e) => setExportFileName(e.target.value)}
              placeholder="pixel-grid"
            />
          </label>
        </div>
        <div className={styles.exportImportButtons}>
          <button onClick={handleExport} className={styles.exportButton}>
            <Icon icon="mdi:export" />
            Export
          </button>
          <button onClick={handleImport} className={styles.importButton}>
            <Icon icon="mdi:import" />
            Import
          </button>
        </div>
      </div>

      {/* Grid Edit Group */}
      <div className={styles.gridEditGroup}>
        <div className={styles.gridEditLabel}>Grid Edit</div>
        <label>
          Pixel Aspect Ratio
          <input
            type="range"
            min="0.25"
            max="4"
            step="0.1"
            value={aspectRatio}
            onChange={(e) => handleAspectRatioChange(Number(e.target.value))}
            onMouseDown={handleSliderStart}
            onMouseUp={handleSliderEnd}
            onTouchStart={handleSliderStart}
            onTouchEnd={handleSliderEnd}
          />
          <span className={styles.valueDisplay}>
            {pixW} × {pixH} ({aspectRatio.toFixed(2)}:1)
          </span>
        </label>
        <label>
          Gap X
          <input
            type="range"
            min="0"
            max="20"
            value={gapX}
            onChange={(e) => handleGapXChange(Number(e.target.value))}
            onMouseDown={handleSliderStart}
            onMouseUp={handleSliderEnd}
            onTouchStart={handleSliderStart}
            onTouchEnd={handleSliderEnd}
          />
        </label>
        <label>
          Gap Y
          <input
            type="range"
            min="0"
            max="20"
            value={gapY}
            onChange={(e) => handleGapYChange(Number(e.target.value))}
            onMouseDown={handleSliderStart}
            onMouseUp={handleSliderEnd}
            onTouchStart={handleSliderStart}
            onTouchEnd={handleSliderEnd}
          />
        </label>
        <label>
          Grid Size
          <select
            value={gridSize}
            onChange={(e) => handleGridSizeChange(Number(e.target.value))}
          >
            <option value={16}>16 × 16</option>
            <option value={32}>32 × 32</option>
            <option value={64}>64 × 64</option>
          </select>
        </label>
      </div>
    </div>
  );
}
