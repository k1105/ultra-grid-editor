"use client";

import {useState, useEffect} from "react";
import styles from "./EditorControls.module.css";
import {Icon} from "@iconify/react/dist/iconify.js";
import {useFibonacciSpiral} from "../contexts/FibonacciSpiralContext";

interface FibonacciSpiralControlsProps {
  className?: string;
}

export default function FibonacciSpiralControls({
  className,
}: FibonacciSpiralControlsProps) {
  const {
    state,
    setNumberOfCircles,
    setRotationAngle,
    setDeformationStrength,
    setDrawMode,
  } = useFibonacciSpiral();

  const [isShiftPressed, setIsShiftPressed] = useState(false);

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

      {/* フィボナッチスパイラルコントロール */}
      <div className={styles.controlGroup}>
        <div className={styles.controlLabel}>円の数 (n)</div>
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
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.controlLabel}>回転 (度)</div>
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
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.controlLabel}>変形</div>
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
      </div>
    </div>
  );
}
