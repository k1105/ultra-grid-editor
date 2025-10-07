"use client";

import {useState, useEffect, useCallback} from "react";
import styles from "./EditorControls.module.css";
import {Icon} from "@iconify/react/dist/iconify.js";
import {useFibonacciSpiral} from "../contexts/FibonacciSpiralContext";
import {
  exportFibonacciToZip,
  smartImportFibonacci,
} from "../utils/exportImport";
import {
  importFibonacciStyleOnly,
  importFibonacciGlyphOnly,
} from "../utils/styleImport";

interface FibonacciSpiralControlsProps {
  className?: string;
}

export default function FibonacciSpiralControls({
  className,
}: FibonacciSpiralControlsProps) {
  const {
    state,
    setNumberOfCircles,
    setSpread,
    setRotationAngle,
    setDeformationStrength,
    setDotRadius,
    setCanvasWidthPercent,
    setCanvasHeightPercent,
    setZoom,
    setDotStates,
    setDrawMode,
  } = useFibonacciSpiral();

  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [exportFileName, setExportFileName] = useState("fibonacci-spiral");

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

  // エクスポート処理
  const handleExport = useCallback(async () => {
    try {
      await exportFibonacciToZip(state, exportFileName);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "エクスポートに失敗しました"
      );
    }
  }, [state, exportFileName]);

  // インポート処理
  const handleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.multiple = true; // 複数ファイル選択を可能にする
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length === 0) return;

      try {
        await smartImportFibonacci(files[0], {
          setNumberOfCircles,
          setSpread,
          setRotationAngle,
          setDeformationStrength,
          setDotRadius,
          setCanvasWidthPercent,
          setCanvasHeightPercent,
          setZoom,
          setDotStates,
        });
        alert("ファイルの読み込みが完了しました");
      } catch (error) {
        alert(
          error instanceof Error ? error.message : "無効なファイル形式です"
        );
      }
    };
    input.click();
  }, [
    setNumberOfCircles,
    setSpread,
    setRotationAngle,
    setDeformationStrength,
    setDotRadius,
    setCanvasWidthPercent,
    setCanvasHeightPercent,
    setZoom,
    setDotStates,
  ]);

  // styleのみのインポート処理
  const handleStyleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        await importFibonacciStyleOnly(file, {
          setSpread,
          setRotationAngle,
          setDeformationStrength,
          setDotRadius,
          setCanvasWidthPercent,
          setCanvasHeightPercent,
          setZoom,
        });
        alert("スタイルファイルの読み込みが完了しました");
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "無効なスタイルファイル形式です"
        );
      }
    };
    input.click();
  }, [
    setSpread,
    setRotationAngle,
    setDeformationStrength,
    setDotRadius,
    setCanvasWidthPercent,
    setCanvasHeightPercent,
    setZoom,
  ]);

  // glyphのみのインポート処理
  const handleGlyphImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        await importFibonacciGlyphOnly(file, {
          setNumberOfCircles,
          setDotStates,
        });
        alert("グリフファイルの読み込みが完了しました");
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "無効なグリフファイル形式です"
        );
      }
    };
    input.click();
  }, [setNumberOfCircles, setDotStates]);

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
      <div className={styles.modeButtons}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDrawMode("draw");
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
            setDrawMode("erase");
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
            setDrawMode("move");
          }}
          onMouseDown={handleMouseEvent}
          className={`${styles.modeButton} ${
            displayMode === "move" ? styles.active : ""
          }`}
        >
          <Icon icon="ic:round-back-hand" />
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
              placeholder="fibonacci-spiral"
            />
          </label>
        </div>
        <div className={styles.exportImportButtons}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleExport();
            }}
            className={styles.exportButton}
          >
            <Icon icon="mdi:export" />
            Export (ZIP)
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleImport();
            }}
            className={styles.importButton}
          >
            <Icon icon="mdi:import" />
            Import
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleGlyphImport();
            }}
            className={styles.glyphImportButton}
            title="グリフファイルのみをインポート"
          >
            <Icon icon="mdi:shape-outline" />
          </button>
        </div>
      </div>

      {/* フィボナッチスパイラルコントロール */}
      <div className={styles.gridEditGroup}>
        <div className={styles.gridEditHeader}>
          <div className={styles.gridEditLabel}>Grid Edit</div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStyleImport();
            }}
            className={styles.styleImportButton}
            title="スタイルファイルのみをインポート"
          >
            <Icon icon="mdi:palette-outline" />
          </button>
        </div>

        <label>
          円の数 (n)
          <div className={styles.sliderContainer}>
            <input
              type="range"
              min="1"
              max="1000"
              value={state.numberOfCircles}
              onChange={(e) => {
                e.stopPropagation();
                setNumberOfCircles(parseInt(e.target.value));
              }}
              className={styles.slider}
            />
            <span className={styles.valueDisplay}>{state.numberOfCircles}</span>
          </div>
        </label>

        <label>
          回転 (度)
          <div className={styles.sliderContainer}>
            <input
              type="range"
              min="0"
              max="180"
              step="1"
              value={state.rotationAngle}
              onChange={(e) => {
                e.stopPropagation();
                setRotationAngle(parseFloat(e.target.value));
              }}
              className={styles.slider}
            />
            <span className={styles.valueDisplay}>{state.rotationAngle}°</span>
          </div>
        </label>

        <label>
          変形
          <div className={styles.sliderContainer}>
            <input
              type="range"
              min="1"
              max="5"
              step="0.1"
              value={state.deformationStrength}
              onChange={(e) => {
                e.stopPropagation();
                setDeformationStrength(parseFloat(e.target.value));
              }}
              className={styles.slider}
            />
            <span className={styles.valueDisplay}>
              {state.deformationStrength.toFixed(1)}
            </span>
          </div>
        </label>

        <label>
          ドット半径
          <div className={styles.sliderContainer}>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={state.dotRadius}
              onChange={(e) => {
                e.stopPropagation();
                setDotRadius(parseFloat(e.target.value));
              }}
              className={styles.slider}
            />
            <span className={styles.valueDisplay}>
              {state.dotRadius.toFixed(1)}
            </span>
          </div>
        </label>
      </div>
    </div>
  );
}
