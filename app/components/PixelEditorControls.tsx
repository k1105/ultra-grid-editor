"use client";

import {useCallback} from "react";
import styles from "./EditorControls.module.css";
import {Icon} from "@iconify/react/dist/iconify.js";
import {usePixelEditor} from "../contexts/PixelEditorContext";
import {importPixelStyleOnly, importPixelGlyphOnly} from "../utils/styleImport";

interface PixelEditorControlsProps {
  className?: string;
}

export default function PixelEditorControls({
  className,
}: PixelEditorControlsProps) {
  const {
    state,
    setPixW,
    setPixH,
    setGapX,
    setGapY,
    setCanvasWidthPercent,
    setCanvasHeightPercent,
    setZoom,
    setShowGuides,
    setPixelGrid,
    updateGridSize,
    setBackgroundImage,
    setBackgroundOpacity,
    setBackgroundImageScale,
    setExportFileName,
  } = usePixelEditor();

  // 最大ピクセルサイズの制限
  const MAX_PIXEL_SIZE = 40;

  // グリッドサイズ変更時の処理をメモ化
  const handleGridSizeChange = useCallback(
    (size: number) => {
      updateGridSize(size);
    },
    [updateGridSize]
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
      setGapX(Math.max(0, numValue));
    },
    [setGapX]
  );

  const handleGapYInputChange = useCallback(
    (value: string) => {
      const numValue = parseInt(value) || 0;
      setGapY(Math.max(0, numValue));
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

  // styleのみのインポート処理
  const handleStyleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        await importPixelStyleOnly(file, {
          setPixW,
          setPixH,
          setGapX,
          setGapY,
          setCanvasWidthPercent,
          setCanvasHeightPercent,
          setZoom,
          setShowGuides,
          setBackgroundImage,
          setBackgroundOpacity,
          setBackgroundImageScale,
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
    setPixW,
    setPixH,
    setGapX,
    setGapY,
    setCanvasWidthPercent,
    setCanvasHeightPercent,
    setZoom,
    setShowGuides,
    setBackgroundImage,
    setBackgroundOpacity,
    setBackgroundImageScale,
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
        await importPixelGlyphOnly(file, {
          updateGridSize,
          setPixelGrid,
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
  }, [updateGridSize, setPixelGrid]);

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
      {/* Glyph Group */}
      <div className={styles.glyphGroup}>
        <div className={styles.glyphHeader}>
          <div className={styles.glyphLabel}>Glyph</div>
          <div className={styles.glyphButtons}>
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

      {/* Grid Group */}
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
          Aspect Ratio
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={state.pixW / state.pixH}
            onChange={(e) => {
              e.stopPropagation();
              const ratio = Number(e.target.value);
              let newPixW, newPixH;

              if (ratio >= 1) {
                newPixW = Math.min(MAX_PIXEL_SIZE, Math.round(ratio * 20));
                newPixH = Math.round(newPixW / ratio);
              } else {
                newPixH = Math.min(MAX_PIXEL_SIZE, Math.round(20 / ratio));
                newPixW = Math.round(newPixH * ratio);
              }

              setPixW(newPixW);
              setPixH(newPixH);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              handleSliderStart();
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              handleSliderEnd();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              handleSliderStart();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              handleSliderEnd();
            }}
          />
          <span className={styles.valueDisplay}>
            {state.pixW} × {state.pixH} ({(state.pixW / state.pixH).toFixed(2)}
            :1)
          </span>
        </label>
        <div className={styles.pixelSizeGroup}>
          <label>
            Width
            <input
              type="number"
              min="1"
              max={MAX_PIXEL_SIZE}
              value={state.pixW}
              onChange={(e) => {
                e.stopPropagation();
                const newPixW = Math.max(
                  1,
                  Math.min(MAX_PIXEL_SIZE, parseInt(e.target.value) || 1)
                );
                setPixW(newPixW);
              }}
              className={styles.numberInput}
            />
          </label>
          <label>
            Height
            <input
              type="number"
              min="1"
              max={MAX_PIXEL_SIZE}
              value={state.pixH}
              onChange={(e) => {
                e.stopPropagation();
                const newPixH = Math.max(
                  1,
                  Math.min(MAX_PIXEL_SIZE, parseInt(e.target.value) || 1)
                );
                setPixH(newPixH);
              }}
              className={styles.numberInput}
            />
          </label>
        </div>
        <label>
          Gap X
          <div className={styles.gapInputGroup}>
            <input
              type="range"
              min="0"
              value={state.gapX}
              onChange={(e) => {
                e.stopPropagation();
                handleGapXChange(Number(e.target.value));
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleSliderStart();
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                handleSliderEnd();
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                handleSliderStart();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                handleSliderEnd();
              }}
            />
            <input
              type="number"
              min="0"
              value={state.gapX}
              onChange={(e) => {
                e.stopPropagation();
                handleGapXInputChange(e.target.value);
              }}
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
              onChange={(e) => {
                e.stopPropagation();
                handleGapYChange(Number(e.target.value));
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleSliderStart();
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                handleSliderEnd();
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                handleSliderStart();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                handleSliderEnd();
              }}
            />
            <input
              type="number"
              min="0"
              max="100"
              value={state.gapY}
              onChange={(e) => {
                e.stopPropagation();
                handleGapYInputChange(e.target.value);
              }}
              className={styles.numberInput}
            />
          </div>
        </label>
        <label>
          Grid Size
          <select
            value={state.gridSize}
            onChange={(e) => {
              e.stopPropagation();
              handleGridSizeChange(Number(e.target.value));
            }}
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
