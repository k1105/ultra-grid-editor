"use client";

import styles from "./EditorControls.module.css";
import {Icon} from "@iconify/react/dist/iconify.js";

interface CommonControlsProps {
  className?: string;
  onReset: () => void;
  // Background Image props
  backgroundImage?: string | null;
  backgroundOpacity?: number;
  backgroundImageScale?: number;
  onBackgroundImageSelect?: () => void;
  onBackgroundImageRemove?: () => void;
  onBackgroundOpacityChange?: (value: number) => void;
  onBackgroundImageScaleChange?: (value: number) => void;
  onSliderStart?: () => void;
  onSliderEnd?: () => void;
  showBackgroundImage?: boolean;
  // Import props
  onImport?: () => void;
}

export default function CommonControls({
  className,
  onReset,
  // Background Image props
  backgroundImage,
  backgroundOpacity = 0.5,
  backgroundImageScale = 1,
  onBackgroundImageSelect,
  onBackgroundImageRemove,
  onBackgroundOpacityChange,
  onBackgroundImageScaleChange,
  onSliderStart,
  onSliderEnd,
  showBackgroundImage = false,
  // Import props
  onImport,
}: CommonControlsProps) {
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
      {/* Background Image Group */}
      {showBackgroundImage && (
        <div className={styles.backgroundImageGroup}>
          <div className={styles.backgroundImageLabel}>Background Image</div>
          <div className={styles.backgroundImageControls}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBackgroundImageSelect?.();
              }}
              className={styles.selectImageButton}
            >
              <Icon icon="mdi:image" />
              Select Image
            </button>
            {backgroundImage && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBackgroundImageRemove?.();
                }}
                className={styles.removeImageButton}
              >
                <Icon icon="mdi:close" />
                Remove
              </button>
            )}
          </div>
          {backgroundImage && (
            <>
              <label>
                Opacity
                <div className={styles.opacityInputGroup}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={backgroundOpacity}
                    onChange={(e) => {
                      e.stopPropagation();
                      onBackgroundOpacityChange?.(Number(e.target.value));
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onSliderStart?.();
                    }}
                    onMouseUp={(e) => {
                      e.stopPropagation();
                      onSliderEnd?.();
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      onSliderStart?.();
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      onSliderEnd?.();
                    }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={backgroundOpacity}
                    onChange={(e) => {
                      e.stopPropagation();
                      onBackgroundOpacityChange?.(Number(e.target.value));
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
                    value={backgroundImageScale}
                    onChange={(e) => {
                      e.stopPropagation();
                      onBackgroundImageScaleChange?.(Number(e.target.value));
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onSliderStart?.();
                    }}
                    onMouseUp={(e) => {
                      e.stopPropagation();
                      onSliderEnd?.();
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      onSliderStart?.();
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      onSliderEnd?.();
                    }}
                  />
                  <input
                    type="number"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={backgroundImageScale}
                    onChange={(e) => {
                      e.stopPropagation();
                      onBackgroundImageScaleChange?.(Number(e.target.value));
                    }}
                    className={styles.numberInput}
                  />
                </div>
              </label>
            </>
          )}
        </div>
      )}

      {/* Import Link */}
      {onImport && (
        <div className={styles.importLinkContainer}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onImport();
            }}
            className={styles.importLink}
          >
            Import Older Version
          </button>
        </div>
      )}

      {/* Reset Group */}
      <div className={styles.resetButtonContainer}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReset();
          }}
          className={styles.resetButton}
        >
          Reset Canvas
        </button>
      </div>
    </div>
  );
}
