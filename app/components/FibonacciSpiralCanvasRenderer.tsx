"use client";

import type p5 from "p5";

// グローバル関数の型定義
declare global {
  interface Window {
    toggleFibonacciDot?: (index: number) => void;
    fibonacciSpiralState?: {
      numberOfCircles: number;
      spread: number;
      rotationAngle: number;
      deformationStrength: number;
      dotStates: boolean[];
      drawMode: "draw" | "erase" | "move";
      zoom: number;
      canvasWidthPercent: number;
      canvasHeightPercent: number;
    };
    updateFibonacciSpiralCanvasState?: (
      newState: FibonacciSpiralCanvasState,
      newCallbacks: FibonacciSpiralCanvasCallbacks
    ) => void;
  }
}

export interface FibonacciSpiralCanvasState {
  numberOfCircles: number;
  spread: number;
  rotationAngle: number;
  deformationStrength: number;
  dotStates: boolean[];
  drawMode: "draw" | "erase" | "move";
  zoom: number;
  canvasWidthPercent: number;
  canvasHeightPercent: number;
}

export interface FibonacciSpiralCanvasCallbacks {
  toggleDot: (index: number) => void;
}

export function createFibonacciSpiralCanvasSketch(
  state: FibonacciSpiralCanvasState,
  callbacks: FibonacciSpiralCanvasCallbacks
) {
  return (p: p5) => {
    let dotPositions: Array<{
      x: number;
      y: number;
      radius: number;
      index: number;
    }> = [];
    let isDragging = false;
    let lastToggledIndex = -1;

    // 黄金角
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    // 状態の参照を保持（クロージャーを避けるため）
    let currentStateRef = state;
    let callbacksRef = callbacks;

    // 最新の状態を取得する関数
    const getCurrentState = () => {
      if (window.fibonacciSpiralState) {
        return window.fibonacciSpiralState;
      }
      return currentStateRef;
    };

    // マウス位置からドットを取得
    const getDotAtPosition = (mouseX: number, mouseY: number) => {
      // ズームを考慮してマウス位置を調整
      const currentState = getCurrentState();
      const zoomedMouseX =
        (mouseX - p.width / 2) / currentState.zoom + p.width / 2;
      const zoomedMouseY =
        (mouseY - p.height / 2) / currentState.zoom + p.height / 2;

      // Z-indexを考慮し、末尾（最前面）からチェック
      for (let i = dotPositions.length - 1; i >= 0; i--) {
        const pos = dotPositions[i];
        const dx = zoomedMouseX - pos.x;
        const dy = zoomedMouseY - pos.y;
        // 当たり判定を少し甘くする
        const hitRadius = pos.radius * 1.2;
        if (dx * dx + dy * dy < hitRadius * hitRadius) {
          return pos;
        }
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
      p.noSmooth(); // アンチエイリアスを無効化

      // グローバル関数を設定
      window.toggleFibonacciDot = callbacksRef.toggleDot;
      window.fibonacciSpiralState = state;
    };

    p.draw = () => {
      // 最新の状態を取得（クロージャーを避けるため）
      const currentState = getCurrentState();

      // 描画モードに応じてカーソルを変更
      if (currentState.drawMode === "move") {
        p.cursor("grab");
      } else {
        p.cursor("crosshair");
      }

      // ズーム変換を適用
      p.translate(p.width / 2, p.height / 2);
      p.scale(currentState.zoom);
      p.translate(-p.width / 2, -p.height / 2);

      const width = p.width;
      const height = p.height;

      // キャンバスサイズの変更を適用（PixelCanvasと同様のロジック）
      const effectiveWidth =
        currentState.canvasWidthPercent > 100
          ? 100
          : currentState.canvasWidthPercent;
      const effectiveHeight =
        currentState.canvasWidthPercent < 100
          ? 100
          : (100 / currentState.canvasWidthPercent) * 100;

      const centerX = width / 2;
      const centerY = height / 2;
      const rotationAngleRad = (currentState.rotationAngle * Math.PI) / 180;

      // 背景を描画
      p.background(200); // ダークグレー

      // 変形軸のハンドルを描画（変形強度が1.05より大きい場合）
      if (currentState.deformationStrength > 1.05) {
        const handleVisLength = Math.min(width, height) * 0.4;
        const h_dx = handleVisLength * Math.cos(rotationAngleRad);
        const h_dy = handleVisLength * Math.sin(rotationAngleRad);
        p.push();
        p.drawingContext.setLineDash([4, 4]);
        p.line(centerX - h_dx, centerY - h_dy, centerX + h_dx, centerY + h_dy);
        p.drawingContext.setLineDash([]);
        p.pop();
      }

      // ドット位置をリセット
      dotPositions = [];

      // 各ドットを描画
      for (let i = 0; i < currentState.numberOfCircles; i++) {
        const radius = currentState.spread * Math.sqrt(i) * 2.2;
        const theta = i * goldenAngle;
        const x_rel = radius * Math.cos(theta);
        const y_rel = radius * Math.sin(theta);

        // 回転を適用
        const cos_a = Math.cos(-rotationAngleRad);
        const sin_a = Math.sin(-rotationAngleRad);
        const x_rot = x_rel * cos_a - y_rel * sin_a;
        const y_rot = x_rel * sin_a + y_rel * cos_a;

        // 変形を適用
        const x_stretched = x_rot * currentState.deformationStrength;
        const y_stretched = y_rot;

        // 逆回転を適用
        const cos_b = Math.cos(rotationAngleRad);
        const sin_b = Math.sin(rotationAngleRad);
        const x_final_rel = x_stretched * cos_b - y_stretched * sin_b;
        const y_final_rel = x_stretched * sin_b + y_stretched * cos_b;

        // キャンバスサイズの変更を適用
        const x = centerX + x_final_rel * (effectiveWidth / 100);
        const y = centerY + y_final_rel * (effectiveHeight / 100);

        // ドットの半径を計算
        const dotRadius = currentState.spread * 1.2;

        // 位置情報を保存
        dotPositions.push({x, y, radius: dotRadius, index: i});

        // ドットを描画
        p.push();
        p.noStroke();

        // 状態に応じて色を決定
        const isRed = currentState.dotStates[i];
        if (isRed) {
          p.fill(0);
        } else {
          p.fill(255);
        }

        p.circle(x, y, dotRadius * 2);
        p.pop();
      }
    };

    // マウスプレスでドットトグル開始
    p.mousePressed = (event: MouseEvent) => {
      const dot = getDotAtPosition(p.mouseX, p.mouseY);
      if (dot) {
        isDragging = true;
        if (dot.index !== lastToggledIndex) {
          // 描画モードに応じた処理
          const currentState = getCurrentState();

          // Shiftキーが押されている場合は一時的にモードを反転
          const effectiveMode = event.shiftKey
            ? currentState.drawMode === "draw"
              ? "erase"
              : "draw"
            : currentState.drawMode;

          if (effectiveMode === "draw") {
            // drawモードの場合は白いドットのみを黒にする
            if (!currentState.dotStates[dot.index]) {
              window.toggleFibonacciDot?.(dot.index);
            }
          } else if (effectiveMode === "erase") {
            // 消去モードの場合は黒いドットのみを白に戻す
            if (currentState.dotStates[dot.index]) {
              window.toggleFibonacciDot?.(dot.index);
            }
          }
          // moveモードの場合は何もしない
          lastToggledIndex = dot.index;
        }
      }
    };

    // マウスドラッグでドットトグル継続
    p.mouseDragged = (event: MouseEvent) => {
      if (isDragging) {
        const dot = getDotAtPosition(p.mouseX, p.mouseY);
        if (dot && dot.index !== lastToggledIndex) {
          // 描画モードに応じた処理
          const currentState = getCurrentState();

          // Shiftキーが押されている場合は一時的にモードを反転
          const effectiveMode = event.shiftKey
            ? currentState.drawMode === "draw"
              ? "erase"
              : "draw"
            : currentState.drawMode;

          if (effectiveMode === "draw") {
            // drawモードの場合は白いドットのみを黒にする
            if (!currentState.dotStates[dot.index]) {
              window.toggleFibonacciDot?.(dot.index);
            }
          } else if (effectiveMode === "erase") {
            // 消去モードの場合は黒いドットのみを白に戻す
            if (currentState.dotStates[dot.index]) {
              window.toggleFibonacciDot?.(dot.index);
            }
          }
          // moveモードの場合は何もしない
          lastToggledIndex = dot.index;
        }
      }
    };

    // マウスリリースでドラッグ終了
    p.mouseReleased = () => {
      isDragging = false;
      lastToggledIndex = -1;
    };

    // 状態更新関数（外部から呼び出される）
    const updateState = (
      newState: FibonacciSpiralCanvasState,
      newCallbacks: FibonacciSpiralCanvasCallbacks
    ) => {
      currentStateRef = newState;
      callbacksRef = newCallbacks;
      window.fibonacciSpiralState = newState;
    };

    // グローバル関数として状態更新関数を公開
    window.updateFibonacciSpiralCanvasState = updateState;
  };
}
