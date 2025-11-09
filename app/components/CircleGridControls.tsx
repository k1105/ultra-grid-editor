"use client";

import {useCallback} from "react";
import styles from "./EditorControls.module.css";
import {Icon} from "@iconify/react/dist/iconify.js";
import {useCircleGrid} from "../contexts/CircleGridContext";
import {
  importCircleStyleOnly,
  importCircleGlyphOnly,
} from "../utils/styleImport";

interface CircleGridControlsProps {
  className?: string;
}

export default function CircleGridControls({
  className,
}: CircleGridControlsProps) {
  const {
    state,
    setLayers,
    setRadius,
    setSpacingFactor,
    setCanvasWidthPercent,
    setCanvasHeightPercent,
    setZoom,
    setDotStates,
    setExportFileName,
  } = useCircleGrid();

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
        await importCircleStyleOnly(file, {
          setRadius,
          setSpacingFactor,
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
    setRadius,
    setSpacingFactor,
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
        await importCircleGlyphOnly(file, {
          setLayers,
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
  }, [setLayers, setDotStates]);

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

      {/* Circleグリッドコントロール */}
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
          レイヤー数
          <div className={styles.sliderContainer}>
            <input
              type="range"
              min="3"
              max="20"
              step="1"
              value={state.layers}
              onChange={(e) => {
                e.stopPropagation();
                setLayers(parseInt(e.target.value));
              }}
              className={styles.slider}
            />
            <span className={styles.valueDisplay}>{state.layers}</span>
          </div>
        </label>

        <label>
          円の半径
          <div className={styles.sliderContainer}>
            <input
              type="range"
              min="5"
              max="100"
              step="1"
              value={state.radius}
              onChange={(e) => {
                e.stopPropagation();
                setRadius(parseFloat(e.target.value));
              }}
              className={styles.slider}
            />
            <span className={styles.valueDisplay}>{state.radius}</span>
          </div>
        </label>

        <label>
          間隔
          <div className={styles.sliderContainer}>
            <input
              type="range"
              min="1.0"
              max="2.0"
              step="0.05"
              value={state.spacingFactor}
              onChange={(e) => {
                e.stopPropagation();
                setSpacingFactor(parseFloat(e.target.value));
              }}
              className={styles.slider}
            />
            <span className={styles.valueDisplay}>
              {state.spacingFactor.toFixed(2)}
            </span>
          </div>
        </label>
      </div>
    </div>
  );
}
