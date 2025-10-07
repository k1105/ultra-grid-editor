"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";

// ピクセルエディターの状態型定義
interface PixelEditorState {
  pixW: number;
  pixH: number;
  gapX: number;
  gapY: number;
  gridSize: number;
  drawMode: "draw" | "erase" | "move";
  canvasWidthPercent: number;
  canvasHeightPercent: number;
  zoom: number;
  showGuides: boolean;
  pixelGrid: boolean[][];
  backgroundImage: string | null;
  backgroundOpacity: number;
  backgroundImageScale: number;
  exportFileName: string;
}

// 履歴の型定義
interface HistoryState {
  changes: Array<{
    x: number;
    y: number;
    value: boolean;
  }>;
  gridSize: number;
  timestamp: number;
}

// コンテキストの型定義
interface PixelEditorContextType {
  state: PixelEditorState;
  setPixW: (value: number) => void;
  setPixH: (value: number) => void;
  setGapX: (value: number) => void;
  setGapY: (value: number) => void;
  setGridSize: (value: number) => void;
  setDrawMode: (mode: "draw" | "erase" | "move") => void;
  setCanvasWidthPercent: (value: number) => void;
  setCanvasHeightPercent: (value: number) => void;
  setZoom: (value: number) => void;
  setShowGuides: (value: boolean) => void;
  setPixelGrid: (grid: boolean[][]) => void;
  setBackgroundImage: (image: string | null) => void;
  setBackgroundOpacity: (opacity: number) => void;
  setBackgroundImageScale: (scale: number) => void;
  setExportFileName: (name: string) => void;
  resetCanvas: () => void;
  updateGridSize: (size: number) => void;
  undo: () => void;
  redo: () => void;
  addToHistory: (grid: boolean[][]) => void;
  canUndo: boolean;
  canRedo: boolean;
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
  backgroundImage: null,
  backgroundOpacity: 0.5,
  backgroundImageScale: 1.0,
  exportFileName: "あ",
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
  const [history, setHistory] = useState<HistoryState[]>([
    {
      changes: [],
      gridSize: initialState.gridSize,
      timestamp: Date.now(),
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isUndoRedoAction, setIsUndoRedoAction] = useState(false);

  const MAX_HISTORY_SIZE = 20;

  // 2つのグリッド間の差分を計算する関数
  const calculateChanges = (
    oldGrid: boolean[][],
    newGrid: boolean[][]
  ): Array<{x: number; y: number; value: boolean}> => {
    const changes: Array<{x: number; y: number; value: boolean}> = [];

    for (let y = 0; y < newGrid.length; y++) {
      for (let x = 0; x < newGrid[y].length; x++) {
        if (oldGrid[y]?.[x] !== newGrid[y][x]) {
          changes.push({
            x,
            y,
            value: newGrid[y][x],
          });
        }
      }
    }

    return changes;
  };

  // 履歴に状態を追加する関数
  const addToHistory = useCallback(
    (pixelGrid: boolean[][]) => {
      if (isUndoRedoAction) return; // Undo/Redo操作中は履歴に追加しない

      // 現在のグリッドと新しいグリッドの差分を計算
      const currentGrid = state.pixelGrid;
      const changes = calculateChanges(currentGrid, pixelGrid);

      // 変更がない場合は履歴に追加しない
      if (changes.length === 0) {
        console.log("=== No changes detected, skipping history ===");
        return;
      }

      const newHistoryState: HistoryState = {
        changes,
        gridSize: state.gridSize,
        timestamp: Date.now(),
      };

      console.log("=== addToHistory called ===");
      console.log("Current history length:", history.length);
      console.log("Current history index:", historyIndex);
      console.log("isUndoRedoAction:", isUndoRedoAction);
      console.log("Changes count:", changes.length);
      console.log("Changes:", changes);

      setHistory((prevHistory) => {
        console.log("=== setHistory callback ===");
        console.log("prevHistory length:", prevHistory.length);
        console.log("current historyIndex:", historyIndex);

        // 現在のインデックスより後ろの履歴を削除
        const trimmedHistory = prevHistory.slice(0, historyIndex + 1);
        console.log("trimmedHistory length:", trimmedHistory.length);

        // 新しい履歴を追加
        const newHistory = [...trimmedHistory, newHistoryState];
        console.log("newHistory length:", newHistory.length);

        // 最大サイズを超えた場合、古い履歴を削除
        if (newHistory.length > MAX_HISTORY_SIZE) {
          const trimmedNewHistory = newHistory.slice(-MAX_HISTORY_SIZE);
          setHistoryIndex(MAX_HISTORY_SIZE - 1);
          console.log("History trimmed, new length:", trimmedNewHistory.length);
          return trimmedNewHistory;
        }

        const newIndex = newHistory.length - 1;
        console.log("Setting history index to:", newIndex);
        setHistoryIndex(newIndex);
        console.log(
          "History updated, new length:",
          newHistory.length,
          "new index:",
          newIndex
        );
        console.log(
          "Current history data:",
          newHistory.map((h, i) => ({
            index: i,
            gridSize: h.gridSize,
            changesCount: h.changes.length,
            timestamp: new Date(h.timestamp).toLocaleTimeString(),
          }))
        );
        console.log("=== Returning newHistory ===");
        return newHistory;
      });
    },
    [
      historyIndex,
      isUndoRedoAction,
      state.gridSize,
      state.pixelGrid,
      history.length,
    ]
  );

  // 差分を適用してグリッドを復元する関数
  const applyChanges = (
    baseGrid: boolean[][],
    changes: Array<{x: number; y: number; value: boolean}>,
    originalGridSize?: number
  ): boolean[][] => {
    const newGrid = baseGrid.map((row) => [...row]);
    const currentGridSize = newGrid.length;

    changes.forEach((change) => {
      let targetX = change.x;
      let targetY = change.y;

      // グリッドサイズが変更されている場合、座標を比例的にマッピング
      if (originalGridSize && originalGridSize !== currentGridSize) {
        const scaleX = currentGridSize / originalGridSize;
        const scaleY = currentGridSize / originalGridSize;

        targetX = Math.floor(change.x * scaleX);
        targetY = Math.floor(change.y * scaleY);

        console.log(
          `Mapping coordinate from (${change.x}, ${change.y}) to (${targetX}, ${targetY}) for grid size change ${originalGridSize} -> ${currentGridSize}`
        );
      }

      // 座標が有効かチェック
      if (
        targetY >= 0 &&
        targetY < newGrid.length &&
        targetX >= 0 &&
        targetX < newGrid[targetY].length
      ) {
        newGrid[targetY][targetX] = change.value;
      } else {
        console.log(
          `Skipping invalid coordinate: (${targetX}, ${targetY}) for grid size ${newGrid.length}x${newGrid[0]?.length}`
        );
      }
    });
    return newGrid;
  };

  // Undo機能
  const undo = useCallback(() => {
    console.log("=== undo called ===");
    console.log("Current history index:", historyIndex);
    console.log("History length:", history.length);
    console.log("Can undo:", historyIndex > 0);
    console.log("Current grid size:", state.gridSize);
    console.log(
      "Current grid dimensions:",
      state.pixelGrid.length,
      "x",
      state.pixelGrid[0]?.length
    );

    if (historyIndex > 0) {
      setIsUndoRedoAction(true);
      const currentState = history[historyIndex];
      console.log("Undoing changes:", currentState.changes);
      console.log("History state grid size:", currentState.gridSize);

      // 現在のグリッドから変更を逆適用
      const restoredGrid = applyChanges(
        state.pixelGrid,
        currentState.changes.map((change) => ({
          ...change,
          value: !change.value, // 値を反転
        })),
        currentState.gridSize // グリッドサイズを渡す
      );

      console.log(
        "Restored grid dimensions:",
        restoredGrid.length,
        "x",
        restoredGrid[0]?.length
      );
      setState((prev) => ({
        ...prev,
        pixelGrid: restoredGrid,
      }));
      setHistoryIndex((prev) => prev - 1);
      setIsUndoRedoAction(false);
    }
  }, [history, historyIndex, state.pixelGrid, state.gridSize]);

  // Redo機能
  const redo = useCallback(() => {
    console.log("=== redo called ===");
    console.log("Current history index:", historyIndex);
    console.log("History length:", history.length);
    console.log("Can redo:", historyIndex < history.length - 1);
    console.log("Current grid size:", state.gridSize);
    console.log(
      "Current grid dimensions:",
      state.pixelGrid.length,
      "x",
      state.pixelGrid[0]?.length
    );

    if (historyIndex < history.length - 1) {
      setIsUndoRedoAction(true);
      const nextState = history[historyIndex + 1];
      console.log("Redoing changes:", nextState.changes);
      console.log("History state grid size:", nextState.gridSize);

      // 現在のグリッドに変更を適用
      const restoredGrid = applyChanges(
        state.pixelGrid,
        nextState.changes,
        nextState.gridSize
      );

      console.log(
        "Restored grid dimensions:",
        restoredGrid.length,
        "x",
        restoredGrid[0]?.length
      );
      setState((prev) => ({
        ...prev,
        pixelGrid: restoredGrid,
      }));
      setHistoryIndex((prev) => prev + 1);
      setIsUndoRedoAction(false);
    }
  }, [history, historyIndex, state.pixelGrid, state.gridSize]);

  // キーボードショートカットの処理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

      if (cmdOrCtrl && event.key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          // Cmd+Shift+Z または Ctrl+Shift+Z (Redo)
          redo();
        } else {
          // Cmd+Z または Ctrl+Z (Undo)
          undo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

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

  const setGridSize = useCallback(
    (value: number) => {
      setState((prev) => {
        const newGrid = initializeGrid(value);
        if (!isUndoRedoAction) {
          addToHistory(newGrid);
        }
        return {
          ...prev,
          gridSize: value,
          pixelGrid: newGrid,
        };
      });
    },
    [addToHistory, isUndoRedoAction]
  );

  const setDrawMode = useCallback((mode: "draw" | "erase" | "move") => {
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
    setState((prev) => {
      return {...prev, pixelGrid: grid};
    });
  }, []);

  const setBackgroundImage = useCallback((image: string | null) => {
    setState((prev) => ({...prev, backgroundImage: image}));
  }, []);

  const setBackgroundOpacity = useCallback((opacity: number) => {
    setState((prev) => ({...prev, backgroundOpacity: opacity}));
  }, []);

  const setBackgroundImageScale = useCallback((scale: number) => {
    setState((prev) => ({...prev, backgroundImageScale: scale}));
  }, []);

  const setExportFileName = useCallback((name: string) => {
    setState((prev) => ({...prev, exportFileName: name}));
  }, []);

  const resetCanvas = useCallback(() => {
    setState((prev) => {
      const newGrid = initializeGrid(prev.gridSize);
      if (!isUndoRedoAction) {
        addToHistory(newGrid);
      }
      return {
        ...prev,
        pixelGrid: newGrid,
      };
    });
  }, [addToHistory, isUndoRedoAction]);

  const updateGridSize = useCallback(
    (size: number) => {
      setState((prev) => {
        const newGrid = initializeGrid(size);
        if (!isUndoRedoAction) {
          addToHistory(newGrid);
        }
        return {
          ...prev,
          gridSize: size,
          pixelGrid: newGrid,
        };
      });
    },
    [addToHistory, isUndoRedoAction]
  );

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
    setBackgroundImage,
    setBackgroundOpacity,
    setBackgroundImageScale,
    setExportFileName,
    resetCanvas,
    updateGridSize,
    undo,
    redo,
    addToHistory,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  };

  // historyIndexの変更を監視
  useEffect(() => {
    console.log("=== History Index Changed ===");
    console.log("New history index:", historyIndex);
    console.log("History length:", history.length);
  }, [historyIndex, history.length]);

  // デバッグ用：canUndo/canRedoの状態をログ出力
  console.log("=== Context State ===");
  console.log("History length:", history.length);
  console.log("History index:", historyIndex);
  console.log("canUndo:", historyIndex > 0);
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
