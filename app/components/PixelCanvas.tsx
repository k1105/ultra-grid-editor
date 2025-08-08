"use client";

import {useEffect, useRef, useState} from "react";
import Image from "next/image";
import CanvasViewControls from "./CanvasViewControls";
import styles from "./PixelCanvas.module.css";
import {usePixelEditor} from "../contexts/PixelEditorContext";
import FibonacciSpiralCanvas from "./FibonacciSpiralCanvas";
import {
  createPixelCanvasSketch,
  type PixelCanvasState,
  type PixelCanvasCallbacks,
} from "./PixelCanvasRenderer";

// p5インスタンスの型定義
interface P5Instance {
  remove: () => void;
}

interface PixelCanvasProps {
  className?: string;
  mode?: "pixel" | "fibonacci";
}

export default function PixelCanvas({
  className,
  mode = "pixel",
}: PixelCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<P5Instance | null>(null);
  const [isClient, setIsClient] = useState(false);
  const {
    state,
    setPixelGrid,
    setDrawMode,
    setCanvasWidthPercent,
    setZoom,
    setShowGuides,
    undo,
    redo,
    addToHistory,
  } = usePixelEditor();

  console.log("=== PixelCanvas initialized ===");
  console.log("addToHistory from context:", !!addToHistory);
  console.log("undo from context:", !!undo);
  console.log("redo from context:", !!redo);

  // クライアントサイドでのみ実行
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !canvasRef.current || mode === "fibonacci") return;

    // 既存のp5インスタンスをクリーンアップ
    if (p5InstanceRef.current) {
      p5InstanceRef.current.remove();
      p5InstanceRef.current = null;
    }

    // p5.jsを動的インポート
    import("p5").then((p5Module) => {
      const p5 = p5Module.default;

      // PixelCanvasStateとPixelCanvasCallbacksを準備
      const pixelCanvasState: PixelCanvasState = {
        pixW: state.pixW,
        pixH: state.pixH,
        gapY: state.gapY,
        gapX: state.gapX,
        gridSize: state.gridSize,
        drawMode: state.drawMode,
        canvasWidthPercent: state.canvasWidthPercent,
        canvasHeightPercent: state.canvasHeightPercent,
        zoom: state.zoom,
        showGuides: state.showGuides,
        backgroundImage: state.backgroundImage,
        backgroundOpacity: state.backgroundOpacity,
        backgroundImageScale: state.backgroundImageScale,
        pixelGrid: state.pixelGrid,
      };

      const pixelCanvasCallbacks: PixelCanvasCallbacks = {
        setPixelGrid,
        setDrawMode,
        setCanvasWidthPercent,
        setZoom,
        setShowGuides,
        undo,
        redo,
        addToHistory,
      };

      // スケッチを作成
      const customSketch = createPixelCanvasSketch(
        pixelCanvasState,
        pixelCanvasCallbacks
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
  }, [isClient, mode]); // 依存配列を最小限に

  // グリッドサイズが変更された場合のみp5スケッチを再作成
  useEffect(() => {
    if (p5InstanceRef.current && window.updateGridSize) {
      window.updateGridSize(state.gridSize);
    }
  }, [state.gridSize]);

  // ピクセルグリッドが外部から変更された場合の処理（Undo/Redo用）
  useEffect(() => {
    if (p5InstanceRef.current && window.updatePixelGrid && window.pixelGrid) {
      // グリッドの内容が実際に変更された場合のみ更新
      const currentGrid = window.pixelGrid;
      if (
        currentGrid.length !== state.pixelGrid.length ||
        currentGrid[0]?.length !== state.pixelGrid[0]?.length ||
        JSON.stringify(currentGrid) !== JSON.stringify(state.pixelGrid)
      ) {
        window.updatePixelGrid(state.pixelGrid);
      }
    }
  }, [state.pixelGrid]);

  // 状態変更時にwindow.pixelEditorStateを更新
  useEffect(() => {
    if (window.pixelEditorState && window.updatePixelCanvasState) {
      const pixelCanvasState: PixelCanvasState = {
        pixW: state.pixW,
        pixH: state.pixH,
        gapY: state.gapY,
        gapX: state.gapX,
        gridSize: state.gridSize,
        drawMode: state.drawMode,
        canvasWidthPercent: state.canvasWidthPercent,
        canvasHeightPercent: state.canvasHeightPercent,
        zoom: state.zoom,
        showGuides: state.showGuides,
        backgroundImage: state.backgroundImage,
        backgroundOpacity: state.backgroundOpacity,
        backgroundImageScale: state.backgroundImageScale,
        pixelGrid: state.pixelGrid,
      };

      const pixelCanvasCallbacks: PixelCanvasCallbacks = {
        setPixelGrid,
        setDrawMode,
        setCanvasWidthPercent,
        setZoom,
        setShowGuides,
        undo,
        redo,
        addToHistory,
      };

      window.updatePixelCanvasState(pixelCanvasState, pixelCanvasCallbacks);
    }
  }, [
    state,
    setPixelGrid,
    setDrawMode,
    setCanvasWidthPercent,
    setZoom,
    setShowGuides,
    undo,
    redo,
    addToHistory,
  ]);

  // クライアントサイドでない場合はローディング表示
  if (!isClient) {
    return (
      <div className={`${styles["pixel-canvas"]} ${className}`}>Loading...</div>
    );
  }

  // フィボナッチモードの場合はFibonacciSpiralCanvasを表示
  if (mode === "fibonacci") {
    return <FibonacciSpiralCanvas className={className} />;
  }

  return (
    <div className={`${styles["pixel-canvas"]} ${className}`}>
      {/* キャンバスコンテナ（背景画像を含む） */}
      <div
        ref={canvasRef}
        data-p5-container
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
        }}
      >
        {/* 背景画像をキャンバスコンテナ内に配置 */}
        {state.backgroundImage && (
          <div
            className={styles.backgroundImageLayer}
            style={{
              opacity: state.backgroundOpacity,
              position: "absolute",
              top: "50%",
              left: "50%",
              transformOrigin: "center center",
              width: `${state.backgroundImageScale * 100}%`,
              height: `${state.backgroundImageScale * 100}%`,
              zIndex: 2,
              pointerEvents: "none",
              mixBlendMode: "multiply",
            }}
          >
            <Image
              src={state.backgroundImage}
              alt="Background"
              fill
              style={{
                objectFit: "contain",
              }}
            />
          </div>
        )}
      </div>
      <CanvasViewControls />
    </div>
  );
}
