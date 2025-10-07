"use client";

import type p5 from "p5";

// グローバル関数の型定義
declare global {
  interface Window {
    updateGridSize?: (size: number) => void;
    updatePixelGrid?: (newGrid: boolean[][]) => void;
    resetCanvas?: () => void;
    setDrawMode?: (mode: "draw" | "erase" | "move") => void;
    updateCanvasSize?: (widthPercent: number) => void;
    updateZoom?: (zoom: number) => void;
    setShowGuides?: (show: boolean) => void;
    undo?: () => void;
    redo?: () => void;
    addToHistory?: (grid: boolean[][]) => void;
    pixelEditorState?: {
      pixW: number;
      pixH: number;
      gapY: number;
      gapX: number;
      gridSize: number;
      drawMode: "draw" | "erase" | "move";
      canvasWidthPercent: number;
      canvasHeightPercent: number;
      zoom: number;
      showGuides: boolean;
      backgroundImage: string | null;
      backgroundOpacity: number;
      backgroundImageScale: number;
    };
    pixelGrid?: boolean[][];
    updatePixelCanvasState?: (
      newState: PixelCanvasState,
      newCallbacks: PixelCanvasCallbacks
    ) => void;
  }
}

export interface PixelCanvasState {
  pixW: number;
  pixH: number;
  gapY: number;
  gapX: number;
  gridSize: number;
  drawMode: "draw" | "erase" | "move";
  canvasWidthPercent: number;
  canvasHeightPercent: number;
  zoom: number;
  showGuides: boolean;
  backgroundImage: string | null;
  backgroundOpacity: number;
  backgroundImageScale: number;
  pixelGrid: boolean[][];
}

export interface PixelCanvasCallbacks {
  setPixelGrid: (grid: boolean[][]) => void;
  setDrawMode: (mode: "draw" | "erase" | "move") => void;
  setCanvasWidthPercent: (width: number) => void;
  setZoom: (zoom: number) => void;
  setShowGuides: (show: boolean) => void;
  undo: () => void;
  redo: () => void;
  addToHistory: (grid: boolean[][]) => void;
}

export function createPixelCanvasSketch(
  state: PixelCanvasState,
  callbacks: PixelCanvasCallbacks
) {
  return (p: p5) => {
    let grid: boolean[][] = [];
    let cols: number;
    let rows: number;
    let isDrawing = false;
    let isDragging = false;
    let lastDrawnCell: {x: number; y: number} | null = null;
    let showStroke = true; // ストローク表示フラグ

    // グリフ移動用の変数
    let isMovingGlyph = false;
    let moveStartCell: {x: number; y: number} | null = null;
    let originalGrid: boolean[][] = [];
    let glyphBounds: {
      minX: number;
      minY: number;
      maxX: number;
      maxY: number;
    } | null = null;

    // 状態の参照を保持（クロージャーを避けるため）
    let currentStateRef = state;
    let callbacksRef = callbacks;

    // グリフの境界を計算する関数
    const calculateGlyphBounds = (
      grid: boolean[][]
    ): {minX: number; minY: number; maxX: number; maxY: number} | null => {
      let minX = grid[0].length;
      let minY = grid.length;
      let maxX = -1;
      let maxY = -1;
      let hasPixels = false;

      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          if (grid[y][x]) {
            hasPixels = true;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      return hasPixels ? {minX, minY, maxX, maxY} : null;
    };

    // グリフを移動する関数
    const moveGlyph = (
      grid: boolean[][],
      bounds: {minX: number; minY: number; maxX: number; maxY: number},
      deltaX: number,
      deltaY: number
    ): boolean[][] => {
      const newGrid = Array.from({length: grid.length}, () =>
        Array(grid[0].length).fill(false)
      );

      for (let y = bounds.minY; y <= bounds.maxY; y++) {
        for (let x = bounds.minX; x <= bounds.maxX; x++) {
          if (grid[y][x]) {
            const newX = x + deltaX;
            const newY = y + deltaY;

            // 境界チェック
            if (
              newX >= 0 &&
              newX < grid[0].length &&
              newY >= 0 &&
              newY < grid.length
            ) {
              newGrid[newY][newX] = true;
            }
          }
        }
      }

      return newGrid;
    };

    // 最新の状態を取得する関数（最適化版）
    const getCurrentState = () => {
      // window.pixelEditorStateが存在し、かつ背景画像関連のプロパティが含まれている場合は使用
      if (
        window.pixelEditorState &&
        "backgroundImageScale" in window.pixelEditorState
      ) {
        return window.pixelEditorState;
      }
      return currentStateRef;
    };

    // 指定サイズでグリッド初期化
    const setupGrid = (size: number) => {
      cols = rows = size;
      grid = Array.from({length: rows}, () => Array(cols).fill(false));
      // グローバルstateに保存
      callbacksRef.setPixelGrid(grid);
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
      const canvas = p.createCanvas(800, 800);
      // p5.jsの型定義の問題を回避するため、DOM要素を直接取得
      const parentElement =
        document.querySelector("[data-p5-container]") || document.body;
      if (parentElement && canvas.elt) {
        parentElement.appendChild(canvas.elt);
      }
      p.pixelDensity(1);
      if (showStroke) {
        p.stroke(200);
      } else {
        p.noStroke();
      }
      p.noSmooth(); // アンチエイリアスを無効化

      // 初期グリッド
      cols = rows = state.gridSize;
      grid = state.pixelGrid.map((row) => [...row]); // ディープコピーを作成
      p.pixelDensity(1);

      // グローバル関数を一度だけ設定
      window.updateGridSize = (size: number) => {
        setupGrid(size);
      };
      window.updatePixelGrid = (newGrid: boolean[][]) => {
        if (newGrid && newGrid.length > 0 && newGrid[0].length > 0) {
          // 新しいグリッドサイズに合わせてcols, rowsを更新
          cols = newGrid[0].length;
          rows = newGrid.length;
          grid = newGrid;
          // グローバルstateに保存しない（無限ループを防ぐ）
          window.pixelGrid = newGrid;
        }
      };
      window.resetCanvas = resetCanvas;
      window.setDrawMode = callbacks.setDrawMode;
      window.updateCanvasSize = callbacks.setCanvasWidthPercent;
      window.updateZoom = callbacks.setZoom;
      window.setShowGuides = callbacks.setShowGuides;
      window.undo = callbacks.undo;
      window.redo = callbacks.redo;
      window.addToHistory = callbacks.addToHistory;
      window.pixelEditorState = state;
      window.pixelGrid = grid;
    };

    p.draw = () => {
      const currentState = getCurrentState();

      // 移動モードの時にカーソルを手のひらに変更
      if (currentState.drawMode === "move") {
        if (isMovingGlyph) {
          p.cursor("grabbing");
        } else {
          p.cursor("grab");
        }
      } else {
        p.cursor("default");
      }

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

      // ストローク設定
      if (showStroke) {
        p.stroke(200);
      } else {
        p.noStroke();
      }

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
        const currentState = getCurrentState();

        // 移動モードの場合
        if (currentState.drawMode === "move") {
          // グリフの境界を計算
          glyphBounds = calculateGlyphBounds(grid);
          if (glyphBounds) {
            isMovingGlyph = true;
            moveStartCell = cell;
            originalGrid = grid.map((row) => [...row]);
          }
          return;
        }

        // 描画モードの場合
        isDrawing = true;
        isDragging = false; // ドラッグ開始フラグをリセット

        // Shiftキーが押されている場合は一時的にモードを反転
        const effectiveMode = event.shiftKey
          ? currentState.drawMode === "draw"
            ? "erase"
            : "draw"
          : currentState.drawMode;

        // 一時的なモードでセルを描画（window.pixelEditorStateは変更しない）
        grid[cell.y][cell.x] = effectiveMode === "draw";
        // ディープコピーを作成してsetPixelGridに渡す
        const newGrid = grid.map((row) => [...row]);
        callbacksRef.setPixelGrid(newGrid);
        // 単一クリックの場合は履歴に追加
        if (window.addToHistory) {
          window.addToHistory(newGrid);
        }
        lastDrawnCell = {x: cell.x, y: cell.y};
      }
    };

    // マウスドラッグで描画継続
    p.mouseDragged = (event: MouseEvent) => {
      const currentState = getCurrentState();

      // 移動モードの場合
      if (isMovingGlyph && moveStartCell && glyphBounds) {
        const cell = getGridCell(p.mouseX, p.mouseY);
        if (cell) {
          const deltaX = cell.x - moveStartCell.x;
          const deltaY = cell.y - moveStartCell.y;

          // グリフを移動
          const newGrid = moveGlyph(originalGrid, glyphBounds, deltaX, deltaY);
          grid = newGrid;
          callbacksRef.setPixelGrid(newGrid);
        }
        return;
      }

      // 描画モードの場合
      if (isDrawing) {
        isDragging = true; // ドラッグ開始フラグを設定
        const cell = getGridCell(p.mouseX, p.mouseY);
        if (cell) {
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
            // ディープコピーを作成してsetPixelGridに渡す
            const newGrid = grid.map((row) => [...row]);
            callbacksRef.setPixelGrid(newGrid);
            lastDrawnCell = {x: cell.x, y: cell.y};
          }
        }
      }
    };

    // マウスリリースで描画終了
    p.mouseReleased = () => {
      // 移動モードの場合
      if (isMovingGlyph) {
        if (window.addToHistory) {
          const currentGrid = grid.map((row) => [...row]);
          window.addToHistory(currentGrid);
        }
        isMovingGlyph = false;
        moveStartCell = null;
        originalGrid = [];
        glyphBounds = null;
        return;
      }

      // 描画モードの場合
      if (isDrawing && isDragging) {
        // ドラッグが発生した場合のみ履歴に追加
        const currentGrid = grid.map((row) => [...row]);
        if (window.addToHistory) {
          window.addToHistory(currentGrid);
        }
      }
      isDrawing = false;
      isDragging = false;
      lastDrawnCell = null;
    };

    // キーボードイベントハンドラー
    p.keyPressed = () => {
      // hキーでストロークの表示/非表示をトグル
      if (p.key === "h" || p.key === "H") {
        showStroke = !showStroke;
      }
    };

    // 状態更新関数（外部から呼び出される）
    const updateState = (
      newState: PixelCanvasState,
      newCallbacks: PixelCanvasCallbacks
    ) => {
      currentStateRef = newState;
      callbacksRef = newCallbacks;
      window.pixelEditorState = newState;
    };

    // グローバル関数として状態更新関数を公開
    window.updatePixelCanvasState = updateState;
  };
}
