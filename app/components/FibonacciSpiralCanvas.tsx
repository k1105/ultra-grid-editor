"use client";

import {useEffect, useRef, useState} from "react";
import styles from "./FibonacciSpiralCanvas.module.css";
import {useFibonacciSpiral} from "../contexts/FibonacciSpiralContext";
import CanvasViewControls from "./CanvasViewControls";
import {
  createFibonacciSpiralCanvasSketch,
  type FibonacciSpiralCanvasState,
  type FibonacciSpiralCanvasCallbacks,
} from "./FibonacciSpiralCanvasRenderer";

// p5インスタンスの型定義
interface P5Instance {
  remove: () => void;
}

interface FibonacciSpiralCanvasProps {
  className?: string;
}

export default function FibonacciSpiralCanvas({
  className,
}: FibonacciSpiralCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<P5Instance | null>(null);
  const [isClient, setIsClient] = useState(false);
  const {state, toggleDot} = useFibonacciSpiral();

  // クライアントサイドでのみ実行
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !canvasRef.current) return;

    // 既存のp5インスタンスをクリーンアップ
    if (p5InstanceRef.current) {
      p5InstanceRef.current.remove();
      p5InstanceRef.current = null;
    }

    // p5.jsを動的インポート
    import("p5").then((p5Module) => {
      const p5 = p5Module.default;

      // FibonacciSpiralCanvasStateとFibonacciSpiralCanvasCallbacksを準備
      const fibonacciSpiralCanvasState: FibonacciSpiralCanvasState = {
        numberOfCircles: state.numberOfCircles,
        spread: state.spread,
        rotationAngle: state.rotationAngle,
        deformationStrength: state.deformationStrength,
        dotRadius: state.dotRadius,
        dotStates: state.dotStates,
        drawMode: state.drawMode,
        zoom: state.zoom,
        canvasWidthPercent: state.canvasWidthPercent,
        canvasHeightPercent: state.canvasHeightPercent,
      };

      const fibonacciSpiralCanvasCallbacks: FibonacciSpiralCanvasCallbacks = {
        toggleDot,
      };

      // スケッチを作成
      const customSketch = createFibonacciSpiralCanvasSketch(
        fibonacciSpiralCanvasState,
        fibonacciSpiralCanvasCallbacks
      );

      // p5インスタンスを作成
      p5InstanceRef.current = new p5(customSketch);
    });

    // クリーンアップ
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, [isClient, toggleDot]); // 依存配列を最小限に

  // 状態変更時にwindow.fibonacciSpiralStateを更新
  useEffect(() => {
    if (window.updateFibonacciSpiralCanvasState) {
      const fibonacciSpiralCanvasState: FibonacciSpiralCanvasState = {
        numberOfCircles: state.numberOfCircles,
        spread: state.spread,
        rotationAngle: state.rotationAngle,
        deformationStrength: state.deformationStrength,
        dotRadius: state.dotRadius,
        dotStates: state.dotStates,
        drawMode: state.drawMode,
        zoom: state.zoom,
        canvasWidthPercent: state.canvasWidthPercent,
        canvasHeightPercent: state.canvasHeightPercent,
      };

      const fibonacciSpiralCanvasCallbacks: FibonacciSpiralCanvasCallbacks = {
        toggleDot,
      };

      window.updateFibonacciSpiralCanvasState(
        fibonacciSpiralCanvasState,
        fibonacciSpiralCanvasCallbacks
      );
    }
  }, [state, toggleDot]);

  // クライアントサイドでない場合はローディング表示
  if (!isClient) {
    return (
      <div className={`${styles["fibonacci-spiral-canvas"]} ${className}`}>
        Loading...
      </div>
    );
  }

  return (
    <div className={`${styles["fibonacci-spiral-canvas"]} ${className}`}>
      <div
        ref={canvasRef}
        data-p5-container
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
        }}
      />
      <CanvasViewControls mode="fibonacci" />
    </div>
  );
}
