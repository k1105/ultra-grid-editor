"use client";

import {useEffect, useRef, useState} from "react";
import type p5 from "p5";
import styles from "./PreviewWindows.module.css";

// グローバル関数の型定義
declare global {
  interface Window {
    pixelEditorState?: {
      pixW: number;
      pixH: number;
      gapX: number;
      gapY: number;
      gridSize: number;
      drawMode: "draw" | "erase";
      canvasWidthPercent: number;
      canvasHeightPercent: number;
      zoom: number;
      showGuides: boolean;
    };
    pixelGrid?: boolean[][];
  }
}

// p5インスタンスの型定義
interface P5Instance {
  remove: () => void;
}

interface PreviewWindowProps {
  percentage: number;
  label: string;
  className?: string;
}

// 個別のプレビューウィンドウコンポーネント
function PreviewWindow({percentage, label, className}: PreviewWindowProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<P5Instance | null>(null);
  const [isClient, setIsClient] = useState(false);

  // クライアントサイドでのみ実行
  useEffect(() => {
    setIsClient(true);
  }, []);

  // プレビュースケッチ
  const createPreviewSketch = (p: p5) => {
    let cols: number;
    let rows: number;

    p.setup = () => {
      // キャンバス高さを固定（300px）
      const canvasHeight = 100;
      const canvasWidth = 200;
      const canvas = p.createCanvas(canvasWidth, canvasHeight); // 初期横幅は320px、後で調整
      canvas.parent(previewRef.current!);
      p.pixelDensity(1);

      const state = window.pixelEditorState || {
        pixW: 20,
        pixH: 20,
        gapX: 2,
        gapY: 2,
        gridSize: 16,
        drawMode: "draw",
        canvasWidthPercent: 100,
        canvasHeightPercent: 100,
        zoom: 1,
        showGuides: false,
      };
      cols = rows = state.gridSize;
      p.noSmooth();
      p.noStroke();
    };

    p.draw = () => {
      p.clear();
      const state = window.pixelEditorState || {
        pixW: 20,
        pixH: 20,
        gapX: 2,
        gapY: 2,
        gridSize: 16,
        drawMode: "draw",
        canvasWidthPercent: 100,
        canvasHeightPercent: 100,
        zoom: 1,
        showGuides: false,
      };

      const grid = window.pixelGrid;
      if (!grid) return;

      // グリッドの実際のサイズを計算（PixelCanvasのスケーリングは考慮しない）
      const scaledPixW = state.pixW; // canvasWidthPercentの影響を除外
      const scaledPixH = state.pixH; // canvasHeightPercentの影響を除外
      const scaledGapX = state.gapX; // canvasWidthPercentの影響を除外
      const scaledGapY = state.gapY; // canvasHeightPercentの影響を除外

      const stepX = scaledPixW + scaledGapX;
      const stepY = scaledPixH + scaledGapY;

      // グリッド全体のサイズ
      const gridWidth = cols * stepX - scaledGapX;
      const gridHeight = rows * stepY - scaledGapY;

      // プレビューキャンバスの高さ（固定）
      const previewHeight = 100;

      // コンテナの最大幅を設定（プレビューウィンドウの幅に基づく）
      const maxContainerWidth = 200; // プレビューウィンドウの最大幅

      // グリッドがプレビューキャンバスに収まるようにスケールを計算
      const scaleY = previewHeight / gridHeight;
      const scaleX = scaleY; // アスペクト比を保持

      // スケールされたグリッドサイズ
      const finalGridWidth = gridWidth * scaleX;

      // コンテナ内に収まるようにスケールを調整
      let adjustedScaleX = scaleX;
      let adjustedScaleY = scaleY;

      // 横幅が最大幅を超える場合は、横幅に合わせてスケールを調整
      if (finalGridWidth > maxContainerWidth) {
        adjustedScaleX = maxContainerWidth / gridWidth;
        adjustedScaleY = adjustedScaleX; // アスペクト比を保持
      }

      // 調整されたスケールでグリッドサイズを再計算
      const adjustedGridWidth = gridWidth * adjustedScaleX;

      // キャンバス横幅をグリッドサイズに合わせて調整し、percentageを適用
      const baseWidth = Math.max(adjustedGridWidth, 200); // 最小幅200px
      const requiredWidth = Math.min(
        baseWidth * (percentage / 100),
        maxContainerWidth
      ); // 最大幅を制限
      if (p.width !== requiredWidth) {
        p.resizeCanvas(requiredWidth, previewHeight);
      }

      // スケールされたピクセルサイズ（調整されたスケールを使用）
      const finalPixW = scaledPixW * adjustedScaleX * (percentage / 100);
      const finalPixH = scaledPixH * adjustedScaleY;
      const finalGapX = scaledGapX * adjustedScaleX * (percentage / 100);
      const finalGapY = scaledGapY * adjustedScaleY;

      // gapが非常に小さい場合は0として扱う（ピクセル境界の問題を回避）
      const effectiveGapX = Math.abs(finalGapX) < 0.1 ? 0 : finalGapX;
      const effectiveGapY = Math.abs(finalGapY) < 0.1 ? 0 : finalGapY;

      const finalStepX = finalPixW + effectiveGapX;
      const finalStepY = finalPixH + effectiveGapY;

      // 中央揃えのオフセット計算（gapが0の場合は正確に計算）
      const offsetX =
        effectiveGapX === 0
          ? (p.width - cols * finalPixW) / 2
          : (p.width - cols * finalStepX + effectiveGapX) / 2;
      const offsetY =
        effectiveGapY === 0
          ? (p.height - rows * finalPixH) / 2
          : (p.height - rows * finalStepY + effectiveGapY) / 2;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          // gapが0の場合は、ピクセルを完全に連続して配置
          const px =
            effectiveGapX === 0
              ? offsetX + x * finalPixW
              : offsetX + x * finalStepX;
          const py =
            effectiveGapY === 0
              ? offsetY + y * finalPixH
              : offsetY + y * finalStepY;

          if (grid[y][x]) {
            p.fill(0);
          } else {
            p.noFill();
          }
          p.rect(px, py, finalPixW, finalPixH);
        }
      }
    };
  };

  useEffect(() => {
    if (!isClient || !previewRef.current) return;

    // p5.jsを動的インポート
    import("p5").then((p5Module) => {
      const p5 = p5Module.default;
      p5InstanceRef.current = new p5(createPreviewSketch);
    });

    // クリーンアップ
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, [isClient, percentage]);

  // クライアントサイドでない場合はローディング表示
  if (!isClient) {
    return (
      <div className={`${styles.previewWindow} ${className || ""}`}>
        <div className={styles.previewLabel}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={`${styles.previewWindow} ${className || ""}`}>
      <div className={styles.previewLabel}>{label}</div>
      <div ref={previewRef} className={styles.previewCanvas} />
    </div>
  );
}

interface PreviewWindowsProps {
  className?: string;
}

export default function PreviewWindows({className}: PreviewWindowsProps) {
  return (
    <div className={`${styles.previewContainer} ${className || ""}`}>
      <PreviewWindow percentage={100} label="横幅100%" />
      <PreviewWindow percentage={50} label="横幅50%" />
      <PreviewWindow percentage={10} label="横幅10%" />
    </div>
  );
}
