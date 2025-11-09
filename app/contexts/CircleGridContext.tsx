"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

// Circleグリッドの状態型定義
interface CircleGridState {
  layers: number;
  radius: number;
  spacingFactor: number;
  dotStates: boolean[];
  drawMode: "draw" | "erase" | "move";
  zoom: number;
  canvasWidthPercent: number;
  canvasHeightPercent: number;
  exportFileName: string;
}

// コンテキストの型定義
interface CircleGridContextType {
  state: CircleGridState;
  setLayers: (value: number) => void;
  setRadius: (value: number) => void;
  setSpacingFactor: (value: number) => void;
  setDrawMode: (mode: "draw" | "erase" | "move") => void;
  setZoom: (value: number) => void;
  setCanvasWidthPercent: (value: number) => void;
  setCanvasHeightPercent: (value: number) => void;
  setDotStates: (states: boolean[]) => void;
  setExportFileName: (name: string) => void;
  toggleDot: (index: number) => void;
  resetCanvas: () => void;
}

// コンテキストの作成
const CircleGridContext = createContext<CircleGridContextType | undefined>(
  undefined
);

// 初期状態
const initialState: CircleGridState = {
  layers: 6,
  radius: 20,
  spacingFactor: 1.4,
  dotStates: Array.from({length: 5000}, () => false), // 最大5000個のドット
  drawMode: "draw",
  zoom: 1,
  canvasWidthPercent: 100,
  canvasHeightPercent: 100,
  exportFileName: "あ",
};

// Providerコンポーネント
interface CircleGridProviderProps {
  children: ReactNode;
}

export function CircleGridProvider({children}: CircleGridProviderProps) {
  const [state, setState] = useState<CircleGridState>(initialState);

  const setLayers = useCallback((value: number) => {
    setState((prev) => {
      // レイヤー数に応じた最大ドット数を概算
      const maxDots = Math.max(5000, value * 100);
      return {
        ...prev,
        layers: value,
        dotStates: Array.from({length: maxDots}, (_, i) =>
          i < prev.dotStates.length ? prev.dotStates[i] : false
        ),
      };
    });
  }, []);

  const setRadius = useCallback((value: number) => {
    setState((prev) => ({
      ...prev,
      radius: value,
    }));
  }, []);

  const setSpacingFactor = useCallback((value: number) => {
    setState((prev) => ({
      ...prev,
      spacingFactor: value,
    }));
  }, []);

  const setDrawMode = useCallback((mode: "draw" | "erase" | "move") => {
    setState((prev) => ({
      ...prev,
      drawMode: mode,
    }));
  }, []);

  const setZoom = useCallback((value: number) => {
    setState((prev) => ({
      ...prev,
      zoom: value,
    }));
  }, []);

  const setCanvasWidthPercent = useCallback((value: number) => {
    setState((prev) => ({
      ...prev,
      canvasWidthPercent: value,
    }));
  }, []);

  const setCanvasHeightPercent = useCallback((value: number) => {
    setState((prev) => ({
      ...prev,
      canvasHeightPercent: value,
    }));
  }, []);

  const setDotStates = useCallback((states: boolean[]) => {
    setState((prev) => ({
      ...prev,
      dotStates: states,
    }));
  }, []);

  const setExportFileName = useCallback((name: string) => {
    setState((prev) => ({
      ...prev,
      exportFileName: name,
    }));
  }, []);

  const toggleDot = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      dotStates: prev.dotStates.map((state, i) =>
        i === index ? !state : state
      ),
    }));
  }, []);

  const resetCanvas = useCallback(() => {
    setState((prev) => ({
      ...prev,
      dotStates: Array.from({length: prev.dotStates.length}, () => false),
    }));
  }, []);

  const contextValue: CircleGridContextType = {
    state,
    setLayers,
    setRadius,
    setSpacingFactor,
    setDrawMode,
    setZoom,
    setCanvasWidthPercent,
    setCanvasHeightPercent,
    setDotStates,
    setExportFileName,
    toggleDot,
    resetCanvas,
  };

  return (
    <CircleGridContext.Provider value={contextValue}>
      {children}
    </CircleGridContext.Provider>
  );
}

// カスタムフック
export function useCircleGrid() {
  const context = useContext(CircleGridContext);
  if (context === undefined) {
    throw new Error("useCircleGrid must be used within a CircleGridProvider");
  }
  return context;
}
