"use client";

import {useEffect, useRef, useState} from "react";
import styles from "./CircleGridCanvas.module.css";
import {useCircleGrid} from "../contexts/CircleGridContext";
import CanvasViewControls from "./CanvasViewControls";
import {
  createCircleGridCanvasSketch,
  type CircleGridCanvasState,
  type CircleGridCanvasCallbacks,
} from "./CircleGridCanvasRenderer";

// p5インスタンスの型定義
interface P5Instance {
  remove: () => void;
}

interface CircleGridCanvasProps {
  className?: string;
}

export default function CircleGridCanvas({className}: CircleGridCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<P5Instance | null>(null);
  const [isClient, setIsClient] = useState(false);
  const {state, toggleDot} = useCircleGrid();

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

      // CircleGridCanvasStateとCircleGridCanvasCallbacksを準備
      const circleGridCanvasState: CircleGridCanvasState = {
        layers: state.layers,
        radius: state.radius,
        spacingFactor: state.spacingFactor,
        rotationAngle: state.rotationAngle,
        deformationStrength: state.deformationStrength,
        dotStates: state.dotStates,
        drawMode: state.drawMode,
        zoom: state.zoom,
        canvasWidthPercent: state.canvasWidthPercent,
        canvasHeightPercent: state.canvasHeightPercent,
      };

      const circleGridCanvasCallbacks: CircleGridCanvasCallbacks = {
        toggleDot,
      };

      // スケッチを作成
      const customSketch = createCircleGridCanvasSketch(
        circleGridCanvasState,
        circleGridCanvasCallbacks
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

  // 状態変更時にwindow.circleGridStateを更新
  useEffect(() => {
    if (window.updateCircleGridCanvasState) {
      const circleGridCanvasState: CircleGridCanvasState = {
        layers: state.layers,
        radius: state.radius,
        spacingFactor: state.spacingFactor,
        rotationAngle: state.rotationAngle,
        deformationStrength: state.deformationStrength,
        dotStates: state.dotStates,
        drawMode: state.drawMode,
        zoom: state.zoom,
        canvasWidthPercent: state.canvasWidthPercent,
        canvasHeightPercent: state.canvasHeightPercent,
      };

      const circleGridCanvasCallbacks: CircleGridCanvasCallbacks = {
        toggleDot,
      };

      window.updateCircleGridCanvasState(
        circleGridCanvasState,
        circleGridCanvasCallbacks
      );
    }
  }, [state, toggleDot]);

  // クライアントサイドでない場合はローディング表示
  if (!isClient) {
    return (
      <div className={`${styles["circle-grid-canvas"]} ${className}`}>
        Loading...
      </div>
    );
  }

  return (
    <div className={`${styles["circle-grid-canvas"]} ${className}`}>
      <div
        ref={canvasRef}
        data-p5-container
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
        }}
      />
      <CanvasViewControls mode="circle" />
    </div>
  );
}
