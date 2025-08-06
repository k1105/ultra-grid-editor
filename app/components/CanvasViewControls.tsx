"use client";

import {useState} from "react";
import Image from "next/image";
import styles from "./PixelCanvas.module.css";
import {usePixelEditor} from "../contexts/PixelEditorContext";
import {useFibonacciSpiral} from "../contexts/FibonacciSpiralContext";

interface CanvasViewControlsProps {
  className?: string;
  mode?: "pixel" | "fibonacci";
}

export default function CanvasViewControls({
  className,
  mode = "pixel",
}: CanvasViewControlsProps) {
  const pixelState = usePixelEditor();
  const fibonacciState = useFibonacciSpiral();

  // モードに応じて状態を選択
  const state = mode === "pixel" ? pixelState.state : fibonacciState.state;
  const setCanvasWidthPercent =
    mode === "pixel"
      ? pixelState.setCanvasWidthPercent
      : fibonacciState.setCanvasWidthPercent;
  const setZoom =
    mode === "pixel" ? pixelState.setZoom : fibonacciState.setZoom;
  const setCanvasHeightPercent =
    mode === "pixel"
      ? pixelState.setCanvasHeightPercent
      : fibonacciState.setCanvasHeightPercent;
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
      className={`${styles["canvas-view-controls"]} ${className || ""}`}
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
      {/* ズームコントロール */}
      <div className={styles["zoom-controls"]}>
        <div className={styles["zoom-buttons"]}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleZoomOut();
            }}
            onMouseDown={handleMouseEvent}
            className={`${styles["zoom-button"]} ${styles["zoom-out"]}`}
          >
            -
          </button>
          <span className={styles["zoom-display"]}>
            {(state.zoom * 100).toFixed(0)}%
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleZoomIn();
            }}
            onMouseDown={handleMouseEvent}
            className={`${styles["zoom-button"]} ${styles["zoom-in"]}`}
          >
            +
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleZoomReset();
            }}
            onMouseDown={handleMouseEvent}
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
          onClick={(e) => {
            e.stopPropagation();
            setIsDistortionExpanded(!isDistortionExpanded);
          }}
          onMouseDown={handleMouseEvent}
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
                      onChange={(e) => {
                        e.stopPropagation();
                        handleWidthChange(Number(e.target.value));
                      }}
                      onMouseDown={handleMouseEvent}
                      onClick={handleMouseEvent}
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleDistortionReset();
                }}
                onMouseDown={handleMouseEvent}
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
