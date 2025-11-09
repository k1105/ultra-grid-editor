"use client";

import React from "react";
import PixelEditorControls from "./PixelEditorControls";
import FibonacciSpiralControls from "./FibonacciSpiralControls";
import CircleGridControls from "./CircleGridControls";
import TopCommonControls from "./TopCommonControls";
import CommonControls from "./CommonControls";
import {usePixelEditor} from "../contexts/PixelEditorContext";
import {useFibonacciSpiral} from "../contexts/FibonacciSpiralContext";
import {useCircleGrid} from "../contexts/CircleGridContext";

interface EditorControlsProps {
  className?: string;
  mode?: "pixel" | "fibonacci" | "circle";
}

export default function EditorControls({
  className,
  mode = "pixel",
}: EditorControlsProps) {
  const pixelEditor = usePixelEditor();
  const fibonacciSpiral = useFibonacciSpiral();
  const circleGrid = useCircleGrid();

  // 現在のモードに基づいてコンテキストを選択
  const currentContext =
    mode === "pixel"
      ? pixelEditor
      : mode === "fibonacci"
        ? fibonacciSpiral
        : circleGrid;

  // 背景画像選択処理
  const handleBackgroundImageSelect = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        pixelEditor.setBackgroundImage(result);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // 背景画像削除処理
  const handleBackgroundImageRemove = () => {
    pixelEditor.setBackgroundImage(null);
  };

  // トップコントロールのプロパティを準備
  const topCommonControlProps = {
    canUndo: mode === "pixel" ? pixelEditor.canUndo : false,
    canRedo: mode === "pixel" ? pixelEditor.canRedo : false,
    onUndo: mode === "pixel" ? pixelEditor.undo : () => {},
    onRedo: mode === "pixel" ? pixelEditor.redo : () => {},
    showUndoRedo: mode === "pixel", // フィボナッチ・サークルモードではUndo/Redoを無効化
    // 描画モード関連のprops
    showDrawMode: true,
    drawMode:
      mode === "pixel"
        ? pixelEditor.state.drawMode
        : mode === "fibonacci"
          ? fibonacciSpiral.state.drawMode
          : circleGrid.state.drawMode,
    onDrawModeChange:
      mode === "pixel"
        ? pixelEditor.setDrawMode
        : mode === "fibonacci"
          ? fibonacciSpiral.setDrawMode
          : circleGrid.setDrawMode,
    // モード情報
    currentMode: mode,
  };

  // 共通コントロールのプロパティを準備
  const commonControlProps = {
    onReset: currentContext.resetCanvas,
    showBackgroundImage: mode === "pixel", // 背景画像はピクセルモードのみ
    backgroundImage:
      mode === "pixel" ? pixelEditor.state.backgroundImage : null,
    backgroundOpacity:
      mode === "pixel" ? pixelEditor.state.backgroundOpacity : 0.5,
    backgroundImageScale:
      mode === "pixel" ? pixelEditor.state.backgroundImageScale : 1,
    onBackgroundImageSelect:
      mode === "pixel" ? handleBackgroundImageSelect : undefined,
    onBackgroundImageRemove:
      mode === "pixel" ? handleBackgroundImageRemove : undefined,
    onBackgroundOpacityChange:
      mode === "pixel" ? pixelEditor.setBackgroundOpacity : undefined,
    onBackgroundImageScaleChange:
      mode === "pixel" ? pixelEditor.setBackgroundImageScale : undefined,
    onSliderStart:
      mode === "pixel" ? () => pixelEditor.setShowGuides(true) : undefined,
    onSliderEnd:
      mode === "pixel" ? () => pixelEditor.setShowGuides(false) : undefined,
    // Import機能
    onImport:
      mode === "pixel"
        ? () => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".json";
            input.multiple = true;
            input.onchange = async (e) => {
              const files = Array.from(
                (e.target as HTMLInputElement).files || []
              );
              if (files.length === 0) return;

              try {
                const {smartImportPixel} = await import(
                  "../utils/exportImport"
                );
                await smartImportPixel(files[0], {
                  setPixW: pixelEditor.setPixW,
                  setPixH: pixelEditor.setPixH,
                  setGapX: pixelEditor.setGapX,
                  setGapY: pixelEditor.setGapY,
                  updateGridSize: pixelEditor.updateGridSize,
                  setCanvasWidthPercent: pixelEditor.setCanvasWidthPercent,
                  setCanvasHeightPercent: pixelEditor.setCanvasHeightPercent,
                  setZoom: pixelEditor.setZoom,
                  setShowGuides: pixelEditor.setShowGuides,
                  setPixelGrid: pixelEditor.setPixelGrid,
                  setBackgroundImage: pixelEditor.setBackgroundImage,
                  setBackgroundOpacity: pixelEditor.setBackgroundOpacity,
                  setBackgroundImageScale: pixelEditor.setBackgroundImageScale,
                });
                alert("ファイルの読み込みが完了しました");
              } catch (error) {
                alert(
                  error instanceof Error
                    ? error.message
                    : "無効なファイル形式です"
                );
              }
            };
            input.click();
          }
        : mode === "fibonacci"
          ? () => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".json";
              input.multiple = true;
              input.onchange = async (e) => {
                const files = Array.from(
                  (e.target as HTMLInputElement).files || []
                );
                if (files.length === 0) return;

                try {
                  const {smartImportFibonacci} = await import(
                    "../utils/exportImport"
                  );
                  await smartImportFibonacci(files[0], {
                    setNumberOfCircles: fibonacciSpiral.setNumberOfCircles,
                    setSpread: fibonacciSpiral.setSpread,
                    setRotationAngle: fibonacciSpiral.setRotationAngle,
                    setDeformationStrength:
                      fibonacciSpiral.setDeformationStrength,
                    setDotRadius: fibonacciSpiral.setDotRadius,
                    setCanvasWidthPercent: fibonacciSpiral.setCanvasWidthPercent,
                    setCanvasHeightPercent:
                      fibonacciSpiral.setCanvasHeightPercent,
                    setZoom: fibonacciSpiral.setZoom,
                    setDotStates: fibonacciSpiral.setDotStates,
                  });
                  alert("ファイルの読み込みが完了しました");
                } catch (error) {
                  alert(
                    error instanceof Error
                      ? error.message
                      : "無効なファイル形式です"
                  );
                }
              };
              input.click();
            }
          : () => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".json";
              input.multiple = true;
              input.onchange = async (e) => {
                const files = Array.from(
                  (e.target as HTMLInputElement).files || []
                );
                if (files.length === 0) return;

                try {
                  const {smartImportCircleMultiple} = await import(
                    "../utils/exportImport"
                  );
                  await smartImportCircleMultiple(files, {
                    setLayers: circleGrid.setLayers,
                    setRadius: circleGrid.setRadius,
                    setSpacingFactor: circleGrid.setSpacingFactor,
                    setCanvasWidthPercent: circleGrid.setCanvasWidthPercent,
                    setCanvasHeightPercent: circleGrid.setCanvasHeightPercent,
                    setZoom: circleGrid.setZoom,
                    setDotStates: circleGrid.setDotStates,
                  });
                  alert("ファイルの読み込みが完了しました");
                } catch (error) {
                  alert(
                    error instanceof Error
                      ? error.message
                      : "無効なファイル形式です"
                  );
                }
              };
              input.click();
            },
  };

  return (
    <div className={className}>
      {/* トップ共通コントロール（描画モード & Undo/Redo） */}
      <TopCommonControls {...topCommonControlProps} />

      {/* モード固有のコントロール */}
      {mode === "pixel" ? (
        <PixelEditorControls />
      ) : mode === "fibonacci" ? (
        <FibonacciSpiralControls />
      ) : (
        <CircleGridControls />
      )}

      {/* 共通コントロール（背景画像、インポート、リセット） */}
      <CommonControls {...commonControlProps} />
    </div>
  );
}
