"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

// フィボナッチスパイラルの状態型定義
interface FibonacciSpiralState {
  numberOfCircles: number;
  spread: number;
  rotationAngle: number;
  deformationStrength: number;
  dotRadius: number;
  dotStates: boolean[];
  drawMode: "draw" | "erase" | "move";
  zoom: number;
  canvasWidthPercent: number;
  canvasHeightPercent: number;
}

// コンテキストの型定義
interface FibonacciSpiralContextType {
  state: FibonacciSpiralState;
  setNumberOfCircles: (value: number) => void;
  setSpread: (value: number) => void;
  setRotationAngle: (value: number) => void;
  setDeformationStrength: (value: number) => void;
  setDotRadius: (value: number) => void;
  setDrawMode: (mode: "draw" | "erase" | "move") => void;
  setZoom: (value: number) => void;
  setCanvasWidthPercent: (value: number) => void;
  setCanvasHeightPercent: (value: number) => void;
  setDotStates: (states: boolean[]) => void;
  toggleDot: (index: number) => void;
  resetCanvas: () => void;
}

// コンテキストの作成
const FibonacciSpiralContext = createContext<
  FibonacciSpiralContextType | undefined
>(undefined);

// 初期状態
const initialState: FibonacciSpiralState = {
  numberOfCircles: 300,
  spread: 6.0,
  rotationAngle: 0,
  deformationStrength: 1.0,
  dotRadius: 1.2,
  dotStates: Array.from({length: 1000}, () => false), // 最大1000個のドット
  drawMode: "draw",
  zoom: 1,
  canvasWidthPercent: 100,
  canvasHeightPercent: 100,
};

// Providerコンポーネント
interface FibonacciSpiralProviderProps {
  children: ReactNode;
}

export function FibonacciSpiralProvider({
  children,
}: FibonacciSpiralProviderProps) {
  const [state, setState] = useState<FibonacciSpiralState>(initialState);

  const setNumberOfCircles = useCallback((value: number) => {
    setState((prev) => ({
      ...prev,
      numberOfCircles: value,
      // ドットの数を変更した場合、dotStatesも調整
      dotStates: Array.from({length: Math.max(1000, value)}, (_, i) =>
        i < prev.dotStates.length ? prev.dotStates[i] : false
      ),
    }));
  }, []);

  const setSpread = useCallback((value: number) => {
    setState((prev) => ({
      ...prev,
      spread: value,
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

  const setDotRadius = useCallback((value: number) => {
    setState((prev) => ({
      ...prev,
      dotRadius: value,
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

  const contextValue: FibonacciSpiralContextType = {
    state,
    setNumberOfCircles,
    setSpread,
    setRotationAngle,
    setDeformationStrength,
    setDotRadius,
    setDrawMode,
    setZoom,
    setCanvasWidthPercent,
    setCanvasHeightPercent,
    setDotStates,
    toggleDot,
    resetCanvas,
  };

  return (
    <FibonacciSpiralContext.Provider value={contextValue}>
      {children}
    </FibonacciSpiralContext.Provider>
  );
}

// カスタムフック
export function useFibonacciSpiral() {
  const context = useContext(FibonacciSpiralContext);
  if (context === undefined) {
    throw new Error(
      "useFibonacciSpiral must be used within a FibonacciSpiralProvider"
    );
  }
  return context;
}
