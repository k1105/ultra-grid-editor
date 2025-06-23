"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

// ピクセルエディターの状態型定義
interface PixelEditorState {
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
  pixelGrid: boolean[][];
}

// コンテキストの型定義
interface PixelEditorContextType {
  state: PixelEditorState;
  setPixW: (value: number) => void;
  setPixH: (value: number) => void;
  setGapX: (value: number) => void;
  setGapY: (value: number) => void;
  setGridSize: (value: number) => void;
  setDrawMode: (mode: "draw" | "erase") => void;
  setCanvasWidthPercent: (value: number) => void;
  setCanvasHeightPercent: (value: number) => void;
  setZoom: (value: number) => void;
  setShowGuides: (value: boolean) => void;
  setPixelGrid: (grid: boolean[][]) => void;
  resetCanvas: () => void;
  updateGridSize: (size: number) => void;
}

// コンテキストの作成
const PixelEditorContext = createContext<PixelEditorContextType | undefined>(
  undefined
);

// 初期状態
const initialState: PixelEditorState = {
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
  pixelGrid: Array.from({length: 16}, () => Array(16).fill(false)),
};

// グリッドを初期化する関数
const initializeGrid = (size: number): boolean[][] => {
  return Array.from({length: size}, () => Array(size).fill(false));
};

// Providerコンポーネント
interface PixelEditorProviderProps {
  children: ReactNode;
}

export function PixelEditorProvider({children}: PixelEditorProviderProps) {
  const [state, setState] = useState<PixelEditorState>(initialState);

  // 状態更新関数
  const setPixW = useCallback((value: number) => {
    setState((prev) => ({...prev, pixW: value}));
  }, []);

  const setPixH = useCallback((value: number) => {
    setState((prev) => ({...prev, pixH: value}));
  }, []);

  const setGapX = useCallback((value: number) => {
    setState((prev) => ({...prev, gapX: value}));
  }, []);

  const setGapY = useCallback((value: number) => {
    setState((prev) => ({...prev, gapY: value}));
  }, []);

  const setGridSize = useCallback((value: number) => {
    setState((prev) => ({
      ...prev,
      gridSize: value,
      pixelGrid: initializeGrid(value),
    }));
  }, []);

  const setDrawMode = useCallback((mode: "draw" | "erase") => {
    setState((prev) => ({...prev, drawMode: mode}));
  }, []);

  const setCanvasWidthPercent = useCallback((value: number) => {
    setState((prev) => ({...prev, canvasWidthPercent: value}));
  }, []);

  const setCanvasHeightPercent = useCallback((value: number) => {
    setState((prev) => ({...prev, canvasHeightPercent: value}));
  }, []);

  const setZoom = useCallback((value: number) => {
    setState((prev) => ({...prev, zoom: value}));
  }, []);

  const setShowGuides = useCallback((value: boolean) => {
    setState((prev) => ({...prev, showGuides: value}));
  }, []);

  const setPixelGrid = useCallback((grid: boolean[][]) => {
    setState((prev) => ({...prev, pixelGrid: grid}));
  }, []);

  const resetCanvas = useCallback(() => {
    setState((prev) => ({
      ...prev,
      pixelGrid: initializeGrid(prev.gridSize),
    }));
  }, []);

  const updateGridSize = useCallback((size: number) => {
    setState((prev) => ({
      ...prev,
      gridSize: size,
      pixelGrid: initializeGrid(size),
    }));
  }, []);

  const contextValue: PixelEditorContextType = {
    state,
    setPixW,
    setPixH,
    setGapX,
    setGapY,
    setGridSize,
    setDrawMode,
    setCanvasWidthPercent,
    setCanvasHeightPercent,
    setZoom,
    setShowGuides,
    setPixelGrid,
    resetCanvas,
    updateGridSize,
  };

  return (
    <PixelEditorContext.Provider value={contextValue}>
      {children}
    </PixelEditorContext.Provider>
  );
}

// カスタムフック
export function usePixelEditor() {
  const context = useContext(PixelEditorContext);
  if (context === undefined) {
    throw new Error("usePixelEditor must be used within a PixelEditorProvider");
  }
  return context;
}
