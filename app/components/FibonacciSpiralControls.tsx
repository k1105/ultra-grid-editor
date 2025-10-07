"use client";

import {useCallback} from "react";
import styles from "./EditorControls.module.css";
import {Icon} from "@iconify/react/dist/iconify.js";
import {useFibonacciSpiral} from "../contexts/FibonacciSpiralContext";
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
    setExportFileName,
  } = useFibonacciSpiral();

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
      {/* Glyph Group */}
      <div className={styles.glyphGroup}>
        <div className={styles.glyphHeader}>
          <div className={styles.glyphLabel}>Glyph</div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleGlyphImport();
            }}
            className={styles.importButton}
            title="グリフファイルのみをインポート"
          >
            <Icon icon="mdi:import" />
          </button>
        </div>
        <div className={styles.glyphNameInput}>
          <label>
            文字の名前
            <input
              type="text"
              value={state.exportFileName}
              onChange={(e) => setExportFileName(e.target.value)}
              placeholder="あ"
            />
          </label>
        </div>
      </div>

      {/* フィボナッチスパイラルコントロール */}
      <div className={styles.gridEditGroup}>
        <div className={styles.gridEditHeader}>
          <div className={styles.gridEditLabel}>Grid</div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStyleImport();
            }}
            className={styles.importButton}
            title="スタイルファイルのみをインポート"
          >
            <Icon icon="mdi:import" />
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
