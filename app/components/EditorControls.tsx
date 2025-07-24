"use client";

import {useState, useCallback, useEffect} from "react";
import styles from "./EditorControls.module.css";
import {Icon} from "@iconify/react/dist/iconify.js";
import {usePixelEditor} from "../contexts/PixelEditorContext";
import {exportToZip, importFromFile} from "../utils/exportImport";

// グローバル関数の型定義
declare global {
  interface Window {
    updateGridSize?: (size: number) => void;
    setDrawMode?: (mode: "draw" | "erase" | "move") => void;
    setShowGuides?: (show: boolean) => void;
    updatePixelGrid?: (newGrid: boolean[][]) => void;
    pixelEditorState?: {
      pixW: number;
      pixH: number;
      gapX: number;
      gapY: number;
      gridSize: number;
      drawMode: "draw" | "erase" | "move";
      canvasWidthPercent: number;
      canvasHeightPercent: number;
      zoom: number;
      showGuides: boolean;
      backgroundImage: string | null;
      backgroundOpacity: number;
      backgroundImageScale: number;
    };
    resetCanvas?: () => void;
    pixelGrid?: boolean[][];
  }
}

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
    setBackgroundImage,
    setBackgroundOpacity,
    setBackgroundImageScale,
    resetCanvas,
    updateGridSize,
    undo,
    redo,
    canUndo,
    canRedo,
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
    (mode: "draw" | "erase" | "move") => {
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
      setGapX(Math.max(0, numValue)); // 0-100の範囲に制限
    },
    [setGapX]
  );

  const handleGapYInputChange = useCallback(
    (value: string) => {
      const numValue = parseInt(value) || 0;
      setGapY(Math.max(0, numValue)); // 0-100の範囲に制限
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

  // 統合エクスポート処理（ZIP形式でSVGとJSONを同時ダウンロード）
  const handleExport = useCallback(async () => {
    try {
      await exportToZip(state, exportFileName);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "エクスポートに失敗しました"
      );
    }
  }, [state, exportFileName]);

  // 背景画像選択処理
  const handleBackgroundImageSelect = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setBackgroundImage(result);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [setBackgroundImage]);

  // 背景画像削除処理
  const handleBackgroundImageRemove = useCallback(() => {
    setBackgroundImage(null);
  }, [setBackgroundImage]);

  // インポート処理
  const handleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        await importFromFile(file, {
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

  // イベント伝播を停止するハンドラー
  const handleMouseEvent = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // より包括的なイベントハンドラー
  const handlePointerEvent = (e: React.PointerEvent) => {
    e.stopPropagation();
  };

  // タッチイベント用ハンドラー
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
      <div className={styles.modeButtons}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDrawModeChange("draw");
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
            handleDrawModeChange("erase");
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
            handleDrawModeChange("move");
          }}
          onMouseDown={handleMouseEvent}
          className={`${styles.modeButton} ${
            displayMode === "move" ? styles.active : ""
          }`}
        >
          <Icon icon="ic:round-back-hand" />
        </button>
      </div>

      {/* Undo/Redo Group */}
      <div className={styles.undoRedoGroup}>
        <div className={styles.undoRedoLabel}>History</div>
        <div className={styles.undoRedoButtons}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              undo();
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
              redo();
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
            onChange={(e) => {
              e.stopPropagation();
              handleAspectRatioChange(Number(e.target.value));
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
            {state.pixW} × {state.pixH} ({aspectRatio.toFixed(2)}:1)
          </span>
        </label>
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

      {/* Background Image Group */}
      <div className={styles.backgroundImageGroup}>
        <div className={styles.backgroundImageLabel}>Background Image</div>
        <div className={styles.backgroundImageControls}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleBackgroundImageSelect();
            }}
            className={styles.selectImageButton}
          >
            <Icon icon="mdi:image" />
            Select Image
          </button>
          {state.backgroundImage && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleBackgroundImageRemove();
              }}
              className={styles.removeImageButton}
            >
              <Icon icon="mdi:close" />
              Remove
            </button>
          )}
        </div>
        {state.backgroundImage && (
          <>
            <label>
              Opacity
              <div className={styles.opacityInputGroup}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={state.backgroundOpacity}
                  onChange={(e) => {
                    e.stopPropagation();
                    setBackgroundOpacity(Number(e.target.value));
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
                  max="1"
                  step="0.1"
                  value={state.backgroundOpacity}
                  onChange={(e) => {
                    e.stopPropagation();
                    setBackgroundOpacity(Number(e.target.value));
                  }}
                  className={styles.numberInput}
                />
              </div>
            </label>
            <label>
              Scale
              <div className={styles.opacityInputGroup}>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={state.backgroundImageScale}
                  onChange={(e) => {
                    e.stopPropagation();
                    setBackgroundImageScale(Number(e.target.value));
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
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={state.backgroundImageScale}
                  onChange={(e) => {
                    e.stopPropagation();
                    setBackgroundImageScale(Number(e.target.value));
                  }}
                  className={styles.numberInput}
                />
              </div>
            </label>
          </>
        )}
      </div>

      {/* Reset Group - Separated from drawing tools */}

      <div className={styles.resetButtonContainer}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            resetCanvas();
          }}
          className={styles.resetButton}
        >
          Reset Canvas
        </button>
      </div>
    </div>
  );
}
