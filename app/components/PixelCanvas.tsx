"use client";

import {useEffect, useRef, useState} from "react";
import type p5 from "p5";
import CanvasViewControls from "./CanvasViewControls";
import styles from "./PixelCanvas.module.css";
import {usePixelEditor} from "../contexts/PixelEditorContext";

// グローバル関数の型定義
declare global {
  interface Window {
    updateGridSize?: (size: number) => void;
    updatePixelGrid?: (newGrid: boolean[][]) => void;
    resetCanvas?: () => void;
    setDrawMode?: (mode: "draw" | "erase") => void;
    updateCanvasSize?: (widthPercent: number) => void;
    updateZoom?: (zoom: number) => void;
    setShowGuides?: (show: boolean) => void;
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

interface PixelCanvasProps {
  className?: string;
}

export default function PixelCanvas({className}: PixelCanvasProps) {
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
  } = usePixelEditor();

  // クライアントサイドでのみ実行
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !canvasRef.current) return;

    // p5.jsを動的インポート
    import("p5").then((p5Module) => {
      const p5 = p5Module.default;

      // p5.jsスケッチの定義
      const sketch = (p: p5) => {
        let grid: boolean[][] = [];
        let cols: number;
        let rows: number;
        let isDrawing = false;
        let lastDrawnCell: {x: number; y: number} | null = null;

        // 最新の状態を取得する関数
        const getCurrentState = () => {
          return window.pixelEditorState || state;
        };

        // 指定サイズでグリッド初期化
        const setupGrid = (size: number) => {
          cols = rows = size;
          grid = Array.from({length: rows}, () => Array(cols).fill(false));
          // グローバルstateに保存
          setPixelGrid(grid);
        };

        // キャンバスリセット関数
        const resetCanvas = () => {
          setupGrid(cols);
        };

        // マウス位置からグリッドセルを取得（ズーム考慮）
        const getGridCell = (mouseX: number, mouseY: number) => {
          const currentState = getCurrentState();

          // ズームを考慮してマウス位置を調整
          const zoomedMouseX =
            (mouseX - p.width / 2) / currentState.zoom + p.width / 2;
          const zoomedMouseY =
            (mouseY - p.height / 2) / currentState.zoom + p.height / 2;

          // プレビューと同じ変形ロジックを適用
          const effectiveWidth =
            currentState.canvasWidthPercent > 100
              ? 100
              : currentState.canvasWidthPercent;
          const effectiveHeight =
            currentState.canvasWidthPercent < 100
              ? 100
              : (100 / currentState.canvasWidthPercent) * 100;

          // パーセンテージをピクセルサイズに適用
          const scaledPixW = currentState.pixW * (effectiveWidth / 100);
          const scaledPixH = currentState.pixH * (effectiveHeight / 100);
          const scaledGapX = currentState.gapX * (effectiveWidth / 100);
          const scaledGapY = currentState.gapY * (effectiveHeight / 100);

          const stepX = scaledPixW + scaledGapX;
          const stepY = scaledPixH + scaledGapY;
          const offsetX = (p.width - cols * stepX + scaledGapX) / 2;
          const offsetY = (p.height - rows * stepY + scaledGapY) / 2;

          const mx = zoomedMouseX - offsetX;
          const my = zoomedMouseY - offsetY;
          if (mx < 0 || my < 0) return null;

          const col = Math.floor(mx / stepX);
          const row = Math.floor(my / stepY);

          if (col >= 0 && col < cols && row >= 0 && row < rows) {
            return {x: col, y: row};
          }
          return null;
        };

        p.setup = () => {
          const canvas = p.createCanvas(1000, 800);
          canvas.parent(canvasRef.current!);
          p.pixelDensity(1);
          p.stroke(200);
          p.noSmooth(); // アンチエイリアスを無効化

          // 初期グリッド
          cols = rows = state.gridSize;
          grid = [...state.pixelGrid]; // 配列のコピーを作成
          p.pixelDensity(1);
        };

        p.draw = () => {
          const currentState = getCurrentState();

          p.background(255);

          // ズーム変換を適用
          p.translate(p.width / 2, p.height / 2);
          p.scale(currentState.zoom);
          p.translate(-p.width / 2, -p.height / 2);

          // プレビューと同じ変形ロジックを適用
          const effectiveWidth =
            currentState.canvasWidthPercent > 100
              ? 100
              : currentState.canvasWidthPercent;
          const effectiveHeight =
            currentState.canvasWidthPercent < 100
              ? 100
              : (100 / currentState.canvasWidthPercent) * 100;

          // パーセンテージをピクセルサイズに適用
          const scaledPixW = currentState.pixW * (effectiveWidth / 100);
          const scaledPixH = currentState.pixH * (effectiveHeight / 100);
          const scaledGapX = currentState.gapX * (effectiveWidth / 100);
          const scaledGapY = currentState.gapY * (effectiveHeight / 100);

          const stepX = scaledPixW + scaledGapX;
          const stepY = scaledPixH + scaledGapY;

          // 中央揃えのオフセット計算
          const offsetX = (p.width - cols * stepX + scaledGapX) / 2;
          const offsetY = (p.height - rows * stepY + scaledGapY) / 2;

          // グリッド描画
          for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
              const px = offsetX + x * stepX;
              const py = offsetY + y * stepY;
              p.fill(grid[y][x] ? 0 : 255);
              p.rect(px, py, scaledPixW, scaledPixH);

              // ガイドラインの表示（showGuidesフラグがtrueの場合のみ）
              if (currentState.showGuides) {
                p.push();
                p.strokeWeight(1);
                p.stroke(200, 255, 255);
                if (scaledGapX !== 0) {
                  p.line(px, 0, px, p.height);
                  p.line(px + scaledPixW, 0, px + scaledPixW, p.height);
                }
                if (scaledGapY !== 0) {
                  p.line(0, py, p.width, py);
                  p.line(0, py + scaledPixH, p.width, py + scaledPixH);
                }
                p.pop();
              }
            }
          }
        };

        // マウスプレスで描画開始
        p.mousePressed = (event: MouseEvent) => {
          const cell = getGridCell(p.mouseX, p.mouseY);
          if (cell) {
            isDrawing = true;

            const currentState = getCurrentState();

            // Shiftキーが押されている場合は一時的にモードを反転
            const effectiveMode = event.shiftKey
              ? currentState.drawMode === "draw"
                ? "erase"
                : "draw"
              : currentState.drawMode;

            // 一時的なモードでセルを描画（window.pixelEditorStateは変更しない）
            grid[cell.y][cell.x] = effectiveMode === "draw";
            setPixelGrid([...grid]);
            lastDrawnCell = {x: cell.x, y: cell.y};
          }
        };

        // マウスドラッグで描画継続
        p.mouseDragged = (event: MouseEvent) => {
          if (isDrawing) {
            const cell = getGridCell(p.mouseX, p.mouseY);
            if (cell) {
              const currentState = getCurrentState();

              // Shiftキーが押されている場合は一時的にモードを反転
              const effectiveMode = event.shiftKey
                ? currentState.drawMode === "draw"
                  ? "erase"
                  : "draw"
                : currentState.drawMode;

              // 一時的なモードでセルを描画（window.pixelEditorStateは変更しない）
              if (
                (cell && !lastDrawnCell) ||
                (lastDrawnCell &&
                  (cell.x !== lastDrawnCell.x || cell.y !== lastDrawnCell.y))
              ) {
                grid[cell.y][cell.x] = effectiveMode === "draw";
                setPixelGrid([...grid]);
                lastDrawnCell = {x: cell.x, y: cell.y};
              }
            }
          }
        };

        // マウスリリースで描画終了
        p.mouseReleased = () => {
          isDrawing = false;
          lastDrawnCell = null;
        };

        // グローバル関数として公開（後方互換性のため）
        window.updateGridSize = (size: number) => {
          setupGrid(size);
        };
        window.updatePixelGrid = (newGrid: boolean[][]) => {
          if (newGrid && newGrid.length > 0 && newGrid[0].length > 0) {
            // 新しいグリッドサイズに合わせてcols, rowsを更新
            cols = newGrid[0].length;
            rows = newGrid.length;
            grid = newGrid;
            // グローバルstateに保存
            setPixelGrid(grid);
          }
        };
        window.resetCanvas = resetCanvas;
        window.setDrawMode = setDrawMode;
        window.updateCanvasSize = setCanvasWidthPercent;
        window.updateZoom = setZoom;
        window.setShowGuides = setShowGuides;
        window.pixelEditorState = state;
        window.pixelGrid = grid;
      };

      // p5インスタンスを作成
      p5InstanceRef.current = new p5(sketch);
    });

    // クリーンアップ
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, [isClient]); // stateを依存配列から削除

  // グリッドサイズが変更された場合のみp5スケッチを再作成
  useEffect(() => {
    if (p5InstanceRef.current && window.updateGridSize) {
      window.updateGridSize(state.gridSize);
    }
  }, [state.gridSize]);

  // ピクセルグリッドが外部から変更された場合の処理
  useEffect(() => {
    if (p5InstanceRef.current && window.updatePixelGrid) {
      window.updatePixelGrid(state.pixelGrid);
    }
  }, [state.pixelGrid]);

  // 状態変更時にwindow.pixelEditorStateを更新
  useEffect(() => {
    if (window.pixelEditorState) {
      window.pixelEditorState = state;
    }
  }, [state]);

  // クライアントサイドでない場合はローディング表示
  if (!isClient) {
    return (
      <div className={`${styles["pixel-canvas"]} ${className}`}>Loading...</div>
    );
  }

  return (
    <div className={`${styles["pixel-canvas"]} ${className}`}>
      <div ref={canvasRef} />
      <CanvasViewControls />
    </div>
  );
}
