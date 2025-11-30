"use client";

import type p5 from "p5";

// グローバル関数の型定義
declare global {
  interface Window {
    toggleCircleDot?: (key: string) => void;
    circleGridState?: {
      layers: number;
      radius: number;
      spacingFactor: number;
      rotationAngle: number;
      deformationStrength: number;
      dotStates: Record<string, boolean>;
      drawMode: "draw" | "erase" | "move";
      zoom: number;
      canvasWidthPercent: number;
      canvasHeightPercent: number;
      gridType: "honeycomb" | "rectangular";
    };
    updateCircleGridCanvasState?: (
      newState: CircleGridCanvasState,
      newCallbacks: CircleGridCanvasCallbacks
    ) => void;
  }
}

export interface CircleGridCanvasState {
  layers: number;
  radius: number;
  spacingFactor: number;
  rotationAngle: number;
  deformationStrength: number;
  dotStates: Record<string, boolean>;
  drawMode: "draw" | "erase" | "move";
  zoom: number;
  canvasWidthPercent: number;
  canvasHeightPercent: number;
  gridType: "honeycomb" | "rectangular";
}

export interface CircleGridCanvasCallbacks {
  toggleDot: (key: string) => void;
}

export function createCircleGridCanvasSketch(
  state: CircleGridCanvasState,
  callbacks: CircleGridCanvasCallbacks
) {
  return (p: p5) => {
    let dotPositions: Array<{
      x: number;
      y: number;
      radius: number;
      key: string;
    }> = [];
    let isDragging = false;
    let lastToggledKey = "";
    let showStroke = true; // ストローク表示フラグ

    // 状態の参照を保持（クロージャーを避けるため）
    let currentStateRef = state;
    let callbacksRef = callbacks;

    // 最新の状態を取得する関数
    const getCurrentState = () => {
      if (window.circleGridState) {
        return window.circleGridState;
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
      window.toggleCircleDot = callbacksRef.toggleDot;
      window.circleGridState = state;
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

      // キャンバスサイズの変更を適用
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
      p.background(255);

      // ドット位置をリセット
      dotPositions = [];

      if (currentState.gridType === "honeycomb") {
        // 既存のハニカムグリッド
        // 各レイヤーを描画
        for (let i = 0; i < currentState.layers; i++) {
          const radius = p.map(i, 0, currentState.layers - 1, 0, width / 2.8);
          const circleSize = currentState.radius;
          const circumference = p.TWO_PI * radius;
          const circlesPerLayer = Math.max(
            6,
            Math.floor(circumference / (circleSize * currentState.spacingFactor))
          );

          for (let j = 0; j < circlesPerLayer; j++) {
            const angle =
              (p.TWO_PI * j) / circlesPerLayer +
              ((i % 2) * Math.PI) / circlesPerLayer;

            // 基本位置
            const x_rel = Math.cos(angle) * radius;
            const y_rel = Math.sin(angle) * radius;

            // 回転を適用（中心を原点として）
            const cos_a = Math.cos(-rotationAngleRad);
            const sin_a = Math.sin(-rotationAngleRad);
            const x_rot = x_rel * cos_a - y_rel * sin_a;
            const y_rot = x_rel * sin_a + y_rel * cos_a;

            // 変形を適用（X軸方向に伸縮）
            const x_stretched = x_rot * currentState.deformationStrength;
            const y_stretched = y_rot;

            // 逆回転を適用
            const cos_b = Math.cos(rotationAngleRad);
            const sin_b = Math.sin(rotationAngleRad);
            const x_final_rel = x_stretched * cos_b - y_stretched * sin_b;
            const y_final_rel = x_stretched * sin_b + y_stretched * cos_b;

            // 最終位置（中心からの相対位置を絶対位置に変換）
            let x = centerX + x_final_rel;
            let y = centerY + y_final_rel;

            // キャンバスサイズの変更を適用
            x = centerX + (x - centerX) * (effectiveWidth / 100);
            y = centerY + (y - centerY) * (effectiveHeight / 100);

            // ドットの半径
            const dotRadius = circleSize / 2;

            // 座標ベースのキーを生成
            const key = `${i}:${j}`;

            // 位置情報を保存
            dotPositions.push({x, y, radius: dotRadius, key});

            // ドットを描画
            p.push();
            p.strokeWeight(2);
            if (showStroke) {
              p.stroke(200);
            } else {
              p.noStroke();
            }

            // 状態に応じて色を決定
            const isFilled = currentState.dotStates[key];
            if (isFilled) {
              p.fill(0);
            } else {
              p.noFill();
            }

            p.circle(x, y, circleSize);
            p.pop();
          }
        }
      } else if (currentState.gridType === "rectangular") {
        // 矩形グリッド(円形クロップ)
        const circleSize = currentState.radius;
        const spacing = circleSize * currentState.spacingFactor;

        // グリッドのサイズを計算（円の半径に基づく）
        const maxRadius = width / 2.8;
        const gridSize = Math.ceil(maxRadius * 2 / spacing) + 2;

        // 中心からのグリッド配置
        for (let row = -gridSize; row <= gridSize; row++) {
          for (let col = -gridSize; col <= gridSize; col++) {
            // 基本位置（矩形グリッド）
            const x_rel = col * spacing;
            const y_rel = row * spacing;

            // 円形クロップの判定（回転・変形前の位置で判定）
            const distFromCenter = Math.sqrt(x_rel * x_rel + y_rel * y_rel);
            if (distFromCenter > maxRadius) {
              continue; // 円の外側はスキップ
            }

            // 回転を適用（中心を原点として）
            const cos_a = Math.cos(-rotationAngleRad);
            const sin_a = Math.sin(-rotationAngleRad);
            const x_rot = x_rel * cos_a - y_rel * sin_a;
            const y_rot = x_rel * sin_a + y_rel * cos_a;

            // 変形を適用（X軸方向に伸縮）
            const x_stretched = x_rot * currentState.deformationStrength;
            const y_stretched = y_rot;

            // 逆回転を適用
            const cos_b = Math.cos(rotationAngleRad);
            const sin_b = Math.sin(rotationAngleRad);
            const x_final_rel = x_stretched * cos_b - y_stretched * sin_b;
            const y_final_rel = x_stretched * sin_b + y_stretched * cos_b;

            // 最終位置（中心からの相対位置を絶対位置に変換）
            let x = centerX + x_final_rel;
            let y = centerY + y_final_rel;

            // キャンバスサイズの変更を適用
            x = centerX + (x - centerX) * (effectiveWidth / 100);
            y = centerY + (y - centerY) * (effectiveHeight / 100);

            // ドットの半径
            const dotRadius = circleSize / 2;

            // 座標ベースのキーを生成
            const key = `${row}:${col}`;

            // 位置情報を保存
            dotPositions.push({x, y, radius: dotRadius, key});

            // ドットを描画
            p.push();
            p.strokeWeight(2);
            if (showStroke) {
              p.stroke(200);
            } else {
              p.noStroke();
            }

            // 状態に応じて色を決定
            const isFilled = currentState.dotStates[key];
            if (isFilled) {
              p.fill(0);
            } else {
              p.noFill();
            }

            p.circle(x, y, circleSize);
            p.pop();
          }
        }
      }
    };

    // マウスプレスでドットトグル開始
    p.mousePressed = (event: MouseEvent) => {
      const dot = getDotAtPosition(p.mouseX, p.mouseY);
      if (dot) {
        isDragging = true;
        if (dot.key !== lastToggledKey) {
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
            if (!currentState.dotStates[dot.key]) {
              window.toggleCircleDot?.(dot.key);
            }
          } else if (effectiveMode === "erase") {
            // 消去モードの場合は黒いドットのみを白に戻す
            if (currentState.dotStates[dot.key]) {
              window.toggleCircleDot?.(dot.key);
            }
          }
          // moveモードの場合は何もしない
          lastToggledKey = dot.key;
        }
      }
    };

    // マウスドラッグでドットトグル継続
    p.mouseDragged = (event: MouseEvent) => {
      if (isDragging) {
        const dot = getDotAtPosition(p.mouseX, p.mouseY);
        if (dot && dot.key !== lastToggledKey) {
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
            if (!currentState.dotStates[dot.key]) {
              window.toggleCircleDot?.(dot.key);
            }
          } else if (effectiveMode === "erase") {
            // 消去モードの場合は黒いドットのみを白に戻す
            if (currentState.dotStates[dot.key]) {
              window.toggleCircleDot?.(dot.key);
            }
          }
          // moveモードの場合は何もしない
          lastToggledKey = dot.key;
        }
      }
    };

    // マウスリリースでドラッグ終了
    p.mouseReleased = () => {
      isDragging = false;
      lastToggledKey = "";
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
      newState: CircleGridCanvasState,
      newCallbacks: CircleGridCanvasCallbacks
    ) => {
      currentStateRef = newState;
      callbacksRef = newCallbacks;
      window.circleGridState = newState;
    };

    // グローバル関数として状態更新関数を公開
    window.updateCircleGridCanvasState = updateState;
  };
}
