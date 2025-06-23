"use client";

import {useState} from "react";
import Image from "next/image";
import styles from "./PixelCanvas.module.css";
import {usePixelEditor} from "../contexts/PixelEditorContext";

interface CanvasViewControlsProps {
  className?: string;
}

export default function CanvasViewControls({
  className,
}: CanvasViewControlsProps) {
  const {state, setCanvasWidthPercent, setZoom, setCanvasHeightPercent} =
    usePixelEditor();
  const [isDistortionExpanded, setIsDistortionExpanded] = useState(false);

  // 幅変更ハンドラー - widthのみを変更（heightは固定）
  const handleWidthChange = (value: number) => {
    // widthのみを変更し、heightは100%のまま固定
    setCanvasWidthPercent(value);
    // heightは変更しない（100%のまま）
  };

  // ズーム変更ハンドラー
  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  // ズームイン
  const handleZoomIn = () => {
    const newZoom = Math.min(state.zoom * 1.2, 5); // 最大5倍
    handleZoomChange(newZoom);
  };

  // ズームアウト
  const handleZoomOut = () => {
    const newZoom = Math.max(state.zoom / 1.2, 0.1); // 最小0.1倍
    handleZoomChange(newZoom);
  };

  // ズームリセット
  const handleZoomReset = () => {
    handleZoomChange(1);
  };

  // distortionリセットハンドラー
  const handleDistortionReset = () => {
    setCanvasWidthPercent(100);
    setCanvasHeightPercent(100);
  };

  return (
    <div className={`${styles["canvas-view-controls"]} ${className || ""}`}>
      {/* ズームコントロール */}
      <div className={styles["zoom-controls"]}>
        <div className={styles["zoom-buttons"]}>
          <button
            onClick={handleZoomOut}
            className={`${styles["zoom-button"]} ${styles["zoom-out"]}`}
          >
            -
          </button>
          <span className={styles["zoom-display"]}>
            {(state.zoom * 100).toFixed(0)}%
          </span>
          <button
            onClick={handleZoomIn}
            className={`${styles["zoom-button"]} ${styles["zoom-in"]}`}
          >
            +
          </button>
          <button
            onClick={handleZoomReset}
            className={`${styles["zoom-button"]} ${styles["zoom-reset"]}`}
          >
            Reset
          </button>
        </div>
      </div>

      {/* 変形コントロール（折りたたみ可能） */}
      <div className={styles["distortion-section"]}>
        <div
          className={styles["distortion-header"]}
          onClick={() => setIsDistortionExpanded(!isDistortionExpanded)}
        >
          <span>Distortion</span>
          <span className={styles["distortion-value"]}>
            {state.canvasWidthPercent}%
          </span>
          <span className={styles["expand-icon"]}>
            {isDistortionExpanded ? "▼" : "▶"}
          </span>
        </div>

        {isDistortionExpanded && (
          <div className={styles["distortion-content"]}>
            <div className={styles["width-controls"]}>
              <div className={styles["distortion-container"]}>
                <div className={styles["slider-section"]}>
                  <div className={styles["slider-container"]}>
                    <span className={styles["slider-label"]}>Squashed</span>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      value={state.canvasWidthPercent}
                      onChange={(e) =>
                        handleWidthChange(Number(e.target.value))
                      }
                      className={styles["distortion-slider"]}
                    />
                    <span className={styles["slider-label"]}>Stretched</span>
                  </div>
                  <div className={styles["slider-value"]}>
                    {state.canvasWidthPercent}%
                  </div>
                </div>

                {/* 変形プレビュー */}
                <div className={styles["preview-section"]}>
                  <div className={styles["preview-container"]}>
                    <div
                      className={styles["preview-wrapper"]}
                      style={{
                        width: `${
                          state.canvasWidthPercent > 100
                            ? 100
                            : state.canvasWidthPercent
                        }%`,
                        height: `${
                          state.canvasWidthPercent < 100
                            ? 100
                            : (100 / state.canvasWidthPercent) * 100
                        }%`,
                      }}
                    >
                      <Image
                        src="/flakiness.png"
                        alt="distortion preview"
                        className={styles["preview-image"]}
                        width={60}
                        height={60}
                        style={{
                          objectFit: "fill",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Resetボタン */}
              <button
                onClick={handleDistortionReset}
                className={styles["distortion-reset"]}
              >
                Reset to 100%
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
