"use client";

import {useState, useCallback, useEffect} from "react";
import styles from "./EditorControls.module.css";
import {Icon} from "@iconify/react/dist/iconify.js";
import {usePixelEditor} from "../contexts/PixelEditorContext";

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
  pixelData: string[]; // 16進数文字列の配列
  exportDate: string;
}

// ピクセルデータを16進数に圧縮する関数
const compressPixelData = (pixelGrid: boolean[][]): string[] => {
  return pixelGrid.map((row) => {
    let hexString = "";
    for (let i = 0; i < row.length; i += 4) {
      let byte = 0;
      for (let j = 0; j < 4 && i + j < row.length; j++) {
        if (row[i + j]) {
          byte |= 1 << (3 - j);
        }
      }
      hexString += byte.toString(16).padStart(1, "0");
    }
    return hexString;
  });
};

// 16進数からピクセルデータを復元する関数
const decompressPixelData = (
  hexData: string[],
  gridSize: number
): boolean[][] => {
  const pixelGrid: boolean[][] = [];

  for (let row = 0; row < hexData.length; row++) {
    const hexString = hexData[row];
    const pixelRow: boolean[] = [];

    for (let i = 0; i < hexString.length; i++) {
      const byte = parseInt(hexString[i], 16);
      for (let j = 0; j < 4 && pixelRow.length < gridSize; j++) {
        pixelRow.push((byte & (1 << (3 - j))) !== 0);
      }
    }

    // グリッドサイズに合わせて調整
    while (pixelRow.length < gridSize) {
      pixelRow.push(false);
    }
    pixelGrid.push(pixelRow);
  }

  return pixelGrid;
};

interface EditorControlsProps {
  className?: string;
}

export default function EditorControls({className}: EditorControlsProps) {
  const {
    state,
    setPixW,
    setPixH,
    setGapX,
    setGapY,
    setDrawMode,
    setCanvasWidthPercent,
    setCanvasHeightPercent,
    setZoom,
    setShowGuides,
    setPixelGrid,
    resetCanvas,
    updateGridSize,
  } = usePixelEditor();

  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [exportFileName, setExportFileName] = useState("pixel-grid");

  // 最大ピクセルサイズの制限
  const MAX_PIXEL_SIZE = 40;

  // アスペクト比を計算
  const aspectRatio = state.pixW / state.pixH;

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
    ? state.drawMode === "draw"
      ? "erase"
      : "draw"
    : state.drawMode;

  // アスペクト比を変更する関数
  const handleAspectRatioChange = useCallback(
    (ratio: number) => {
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
    },
    [setPixW, setPixH]
  );

  // グリッドサイズ変更時の処理をメモ化
  const handleGridSizeChange = useCallback(
    (size: number) => {
      updateGridSize(size);
    },
    [updateGridSize]
  );

  // 描画モード変更ハンドラー
  const handleDrawModeChange = useCallback(
    (mode: "draw" | "erase") => {
      setDrawMode(mode);
    },
    [setDrawMode]
  );

  // スライダー変更ハンドラーをメモ化
  const handleGapXChange = useCallback(
    (value: number) => setGapX(value),
    [setGapX]
  );
  const handleGapYChange = useCallback(
    (value: number) => setGapY(value),
    [setGapY]
  );

  // 数値入力フィールドのハンドラー
  const handleGapXInputChange = useCallback(
    (value: string) => {
      const numValue = parseInt(value) || 0;
      setGapX(Math.max(0, Math.min(100, numValue))); // 0-100の範囲に制限
    },
    [setGapX]
  );

  const handleGapYInputChange = useCallback(
    (value: string) => {
      const numValue = parseInt(value) || 0;
      setGapY(Math.max(0, Math.min(100, numValue))); // 0-100の範囲に制限
    },
    [setGapY]
  );

  // スライダー操作開始時にガイドラインを表示
  const handleSliderStart = useCallback(() => {
    setShowGuides(true);
  }, [setShowGuides]);

  // スライダー操作終了時にガイドラインを非表示
  const handleSliderEnd = useCallback(() => {
    setShowGuides(false);
  }, [setShowGuides]);

  // エクスポート処理
  const handleExport = useCallback(() => {
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
      pixelData: compressPixelData(state.pixelGrid),
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
  }, [state, exportFileName]);

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
            updateGridSize(data.gridInfo.gridSize);
          }

          // キャンバス状態を更新
          if (data.canvasState) {
            setCanvasWidthPercent(data.canvasState.widthPercent);
            setCanvasHeightPercent(data.canvasState.heightPercent);
            setZoom(data.canvasState.zoom);
            setShowGuides(data.canvasState.showGuides);
          }

          // ピクセルデータを更新
          if (data.pixelData) {
            setPixelGrid(
              decompressPixelData(data.pixelData, data.gridInfo.gridSize)
            );
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
  }, [
    setPixW,
    setPixH,
    setGapX,
    setGapY,
    updateGridSize,
    setCanvasWidthPercent,
    setCanvasHeightPercent,
    setZoom,
    setShowGuides,
    setPixelGrid,
  ]);

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
        <button onClick={resetCanvas} className={styles.resetButton}>
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
            min="0.1"
            max="10"
            step="0.1"
            value={aspectRatio}
            onChange={(e) => handleAspectRatioChange(Number(e.target.value))}
            onMouseDown={handleSliderStart}
            onMouseUp={handleSliderEnd}
            onTouchStart={handleSliderStart}
            onTouchEnd={handleSliderEnd}
          />
          <span className={styles.valueDisplay}>
            {state.pixW} × {state.pixH} ({aspectRatio.toFixed(2)}:1)
          </span>
        </label>
        <label>
          Gap X
          <div className={styles.gapInputGroup}>
            <input
              type="range"
              min="0"
              max="100"
              value={state.gapX}
              onChange={(e) => handleGapXChange(Number(e.target.value))}
              onMouseDown={handleSliderStart}
              onMouseUp={handleSliderEnd}
              onTouchStart={handleSliderStart}
              onTouchEnd={handleSliderEnd}
            />
            <input
              type="number"
              min="0"
              max="100"
              value={state.gapX}
              onChange={(e) => handleGapXInputChange(e.target.value)}
              className={styles.numberInput}
            />
          </div>
        </label>
        <label>
          Gap Y
          <div className={styles.gapInputGroup}>
            <input
              type="range"
              min="0"
              max="100"
              value={state.gapY}
              onChange={(e) => handleGapYChange(Number(e.target.value))}
              onMouseDown={handleSliderStart}
              onMouseUp={handleSliderEnd}
              onTouchStart={handleSliderStart}
              onTouchEnd={handleSliderEnd}
            />
            <input
              type="number"
              min="0"
              max="100"
              value={state.gapY}
              onChange={(e) => handleGapYInputChange(e.target.value)}
              className={styles.numberInput}
            />
          </div>
        </label>
        <label>
          Grid Size
          <select
            value={state.gridSize}
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
