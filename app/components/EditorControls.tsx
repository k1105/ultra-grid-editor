"use client";

import React from "react";
import PixelEditorControls from "./PixelEditorControls";
import FibonacciSpiralControls from "./FibonacciSpiralControls";
import CommonControls from "./CommonControls";
import {usePixelEditor} from "../contexts/PixelEditorContext";
import {useFibonacciSpiral} from "../contexts/FibonacciSpiralContext";

interface EditorControlsProps {
  className?: string;
  mode?: "pixel" | "fibonacci";
}

export default function EditorControls({
  className,
  mode = "pixel",
}: EditorControlsProps) {
  const pixelEditor = usePixelEditor();
  const fibonacciSpiral = useFibonacciSpiral();

  // 現在のモードに基づいてコンテキストを選択
  const currentContext = mode === "pixel" ? pixelEditor : fibonacciSpiral;

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

  // 共通コントロールのプロパティを準備
  const commonControlProps = {
    canUndo: mode === "pixel" ? pixelEditor.canUndo : false,
    canRedo: mode === "pixel" ? pixelEditor.canRedo : false,
    onUndo: mode === "pixel" ? pixelEditor.undo : () => {},
    onRedo: mode === "pixel" ? pixelEditor.redo : () => {},
    onReset: currentContext.resetCanvas,
    showUndoRedo: mode === "pixel", // フィボナッチモードではUndo/Redoを無効化
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
  };

  return (
    <div className={className}>
      {/* モード固有のコントロール */}
      {mode === "pixel" ? <PixelEditorControls /> : <FibonacciSpiralControls />}

      {/* 共通コントロール */}
      <CommonControls {...commonControlProps} />
    </div>
  );
}
