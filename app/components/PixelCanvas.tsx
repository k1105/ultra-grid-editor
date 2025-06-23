"use client";

import {useEffect, useRef, useState} from "react";
import type p5 from "p5";
import CanvasViewControls from "./CanvasViewControls";
import styles from "./PixelCanvas.module.css";

// グローバル関数の型定義
declare global {
  interface Window {
    updateGridSize?: (size: number) => void;
    resetCanvas?: () => void;
    setDrawMode?: (mode: "draw" | "erase") => void;
    updateCanvasSize?: (widthPercent: number, heightPercent: number) => void;
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
        let grid: boolean[][];
        let cols: number;
        let rows: number;
        let isDrawing = false;
        let lastDrawnCell: {x: number; y: number} | null = null;

        // 指定サイズでグリッド初期化
        const setupGrid = (size: number) => {
          cols = rows = size;
          grid = Array.from({length: rows}, () => Array(cols).fill(false));
          // グローバルstateに保存
          window.pixelGrid = grid;
        };

        // キャンバスリセット関数
        const resetCanvas = () => {
          setupGrid(cols);
        };

        // 描画モード設定関数
        const setDrawMode = (mode: "draw" | "erase") => {
          if (window.pixelEditorState) {
            window.pixelEditorState.drawMode = mode;
          }
        };

        // キャンバスサイズ更新関数
        const updateCanvasSize = (
          widthPercent: number,
          heightPercent: number
        ) => {
          // キャンバスサイズは変更せず、グローバルstateのピクセルサイズを更新
          if (window.pixelEditorState) {
            window.pixelEditorState.canvasWidthPercent = widthPercent;
            window.pixelEditorState.canvasHeightPercent = heightPercent;
          }
        };

        // ズーム更新関数
        const updateZoom = (zoom: number) => {
          // ズーム値はグローバルstateに保存
          if (window.pixelEditorState) {
            window.pixelEditorState.zoom = zoom;
          }
        };

        // ガイドライン表示設定関数
        const setShowGuides = (show: boolean) => {
          if (window.pixelEditorState) {
            window.pixelEditorState.showGuides = show;
          }
        };

        // マウス位置からグリッドセルを取得（ズーム考慮）
        const getGridCell = (mouseX: number, mouseY: number) => {
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
          };

          // ズームを考慮してマウス位置を調整
          const zoomedMouseX =
            (mouseX - p.width / 2) / state.zoom + p.width / 2;
          const zoomedMouseY =
            (mouseY - p.height / 2) / state.zoom + p.height / 2;

          // パーセンテージをピクセルサイズに適用
          const scaledPixW = state.pixW * (state.canvasWidthPercent / 100);
          const scaledPixH = state.pixH * (state.canvasHeightPercent / 100);
          const scaledGapX = state.gapX * (state.canvasWidthPercent / 100);
          const scaledGapY = state.gapY * (state.canvasHeightPercent / 100);

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

        // セルを描画/消去
        const drawCell = (cell: {x: number; y: number}) => {
          if (
            (cell && !lastDrawnCell) ||
            (lastDrawnCell &&
              (cell.x !== lastDrawnCell.x || cell.y !== lastDrawnCell.y))
          ) {
            const state = window.pixelEditorState || {
              pixW: 20,
              pixH: 20,
              gapX: 2,
              gapY: 2,
              gridSize: 16,
              drawMode: "draw",
              canvasWidthPercent: 100,
              canvasHeightPercent: 100,
            };

            // 描画モードに基づいてセルを設定
            grid[cell.y][cell.x] = state.drawMode === "draw";
            // グローバルstateに保存
            window.pixelGrid = grid;
            lastDrawnCell = {x: cell.x, y: cell.y};
          }
        };

        p.setup = () => {
          const canvas = p.createCanvas(1000, 800);
          canvas.parent(canvasRef.current!);
          p.noSmooth(); // アンチエイリアスを無効化

          // 初期グリッド
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
          setupGrid(state.gridSize);
        };

        p.draw = () => {
          p.background(240);
          p.noStroke();

          // グローバルstateから値を取得
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

          // ズーム変換を適用
          p.translate(p.width / 2, p.height / 2);
          p.scale(state.zoom);
          p.translate(-p.width / 2, -p.height / 2);

          // パーセンテージをピクセルサイズに適用
          const scaledPixW = state.pixW * (state.canvasWidthPercent / 100);
          const scaledPixH = state.pixH * (state.canvasHeightPercent / 100);
          const scaledGapX = state.gapX * (state.canvasWidthPercent / 100);
          const scaledGapY = state.gapY * (state.canvasHeightPercent / 100);

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
              if (state.showGuides) {
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
        p.mousePressed = () => {
          const cell = getGridCell(p.mouseX, p.mouseY);
          if (cell) {
            isDrawing = true;

            // Shiftキーが押されている場合は一時的にモードをトグル
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
            };

            const currentMode = state.drawMode;
            let drawMode = currentMode;

            // Shiftキーが押されている場合はモードをトグル
            if (p.keyIsDown(p.SHIFT)) {
              drawMode = currentMode === "draw" ? "erase" : "draw";
            }

            // 一時的にモードを変更
            if (window.pixelEditorState) {
              window.pixelEditorState.drawMode = drawMode;
            }

            drawCell(cell);

            // 元のモードに戻す
            if (window.pixelEditorState) {
              window.pixelEditorState.drawMode = currentMode;
            }
          }
        };

        // マウスドラッグで描画継続
        p.mouseDragged = () => {
          if (isDrawing) {
            const cell = getGridCell(p.mouseX, p.mouseY);
            if (cell) {
              // Shiftキーが押されている場合は一時的にモードをトグル
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
              };

              const currentMode = state.drawMode;
              let drawMode = currentMode;

              // Shiftキーが押されている場合はモードをトグル
              if (p.keyIsDown(p.SHIFT)) {
                drawMode = currentMode === "draw" ? "erase" : "draw";
              }

              // 一時的にモードを変更
              if (window.pixelEditorState) {
                window.pixelEditorState.drawMode = drawMode;
              }

              drawCell(cell);

              // 元のモードに戻す
              if (window.pixelEditorState) {
                window.pixelEditorState.drawMode = currentMode;
              }
            }
          }
        };

        // マウスリリースで描画終了
        p.mouseReleased = () => {
          isDrawing = false;
          lastDrawnCell = null;
        };

        // グリッドサイズ変更時の処理
        const updateGridSize = (size: number) => {
          setupGrid(size);
          // グローバルstateも更新
          if (window.pixelEditorState) {
            window.pixelEditorState.gridSize = size;
          }
        };

        // グローバル関数として公開
        window.updateGridSize = updateGridSize;
        window.resetCanvas = resetCanvas;
        window.setDrawMode = setDrawMode;
        window.updateCanvasSize = updateCanvasSize;
        window.updateZoom = updateZoom;
        window.setShowGuides = setShowGuides;
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
  }, [isClient]); // isClientを依存配列に追加

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
