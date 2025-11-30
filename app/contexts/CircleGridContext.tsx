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
  rotationAngle: number;
  deformationStrength: number;
  dotStates: Record<string, boolean>; // キーは "layer:position" または "row:col"
  drawMode: "draw" | "erase" | "move";
  zoom: number;
  canvasWidthPercent: number;
  canvasHeightPercent: number;
  exportFileName: string;
  gridType: "honeycomb" | "rectangular";
}

// コンテキストの型定義
interface CircleGridContextType {
  state: CircleGridState;
  setLayers: (value: number) => void;
  setRadius: (value: number) => void;
  setSpacingFactor: (value: number) => void;
  setRotationAngle: (value: number) => void;
  setDeformationStrength: (value: number) => void;
  setDrawMode: (mode: "draw" | "erase" | "move") => void;
  setZoom: (value: number) => void;
  setCanvasWidthPercent: (value: number) => void;
  setCanvasHeightPercent: (value: number) => void;
  setDotStates: (states: Record<string, boolean>) => void;
  setExportFileName: (name: string) => void;
  setGridType: (type: "honeycomb" | "rectangular") => void;
  toggleDot: (key: string) => void;
  resetCanvas: () => void;
}

// コンテキストの作成
const CircleGridContext = createContext<CircleGridContextType | undefined>(
  undefined
);

// 初期状態
const initialState: CircleGridState = {
  layers: 5,
  radius: 48,
  spacingFactor: 1.4,
  rotationAngle: 0,
  deformationStrength: 1.0,
  dotStates: {}, // 座標ベースのオブジェクト
  drawMode: "draw",
  zoom: 1,
  canvasWidthPercent: 100,
  canvasHeightPercent: 100,
  exportFileName: "あ",
  gridType: "honeycomb",
};

// Providerコンポーネント
interface CircleGridProviderProps {
  children: ReactNode;
}

export function CircleGridProvider({children}: CircleGridProviderProps) {
  const [state, setState] = useState<CircleGridState>(initialState);

  const setLayers = useCallback((value: number) => {
    setState((prev) => ({
      ...prev,
      layers: value,
      // dotStatesはそのまま保持（座標ベースなので自動的に適応）
    }));
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

  const setRotationAngle = useCallback((value: number) => {
    setState((prev) => ({
      ...prev,
      rotationAngle: value,
    }));
  }, []);

  const setDeformationStrength = useCallback((value: number) => {
    setState((prev) => ({
      ...prev,
      deformationStrength: value,
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

  const setDotStates = useCallback((states: Record<string, boolean>) => {
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

  const setGridType = useCallback((type: "honeycomb" | "rectangular") => {
    setState((prev) => ({
      ...prev,
      gridType: type,
    }));
  }, []);

  const toggleDot = useCallback((key: string) => {
    setState((prev) => ({
      ...prev,
      dotStates: {
        ...prev.dotStates,
        [key]: !prev.dotStates[key],
      },
    }));
  }, []);

  const resetCanvas = useCallback(() => {
    setState((prev) => ({
      ...prev,
      dotStates: {},
    }));
  }, []);

  const contextValue: CircleGridContextType = {
    state,
    setLayers,
    setRadius,
    setSpacingFactor,
    setRotationAngle,
    setDeformationStrength,
    setDrawMode,
    setZoom,
    setCanvasWidthPercent,
    setCanvasHeightPercent,
    setDotStates,
    setExportFileName,
    setGridType,
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
