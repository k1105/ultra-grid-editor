"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

// グリフデータの型定義
export interface GlyphData {
  char: string;
  dotStates: Record<string, boolean>;
  layers: number;
  radius: number;
  spacingFactor: number;
  gridType: "honeycomb" | "rectangular";
}

// 文字インスタンスの型定義（個別の変形パラメータを持つ）
export interface CharInstance {
  char: string;
  rotation: number; // 回転角度
  deformation: number; // 変形強度
}

// コンテキストの型定義
interface GlyphContextType {
  // グリフデータベース（文字ごとのパターン）
  glyphDatabase: Record<string, GlyphData>;
  loadGlyph: (char: string, data: GlyphData) => void;

  // テキスト編集
  text: CharInstance[];
  addChar: (char: string) => void;
  removeChar: (index: number) => void;
  updateCharRotation: (index: number, rotation: number) => void;
  updateCharDeformation: (index: number, deformation: number) => void;
  setText: (text: CharInstance[]) => void;

  // グローバル設定
  globalKerning: number;
  setGlobalKerning: (value: number) => void;

  // 選択中の文字
  selectedCharIndex: number | null;
  setSelectedCharIndex: (index: number | null) => void;
}

// コンテキストの作成
const GlyphContext = createContext<GlyphContextType | undefined>(undefined);

// Providerコンポーネント
interface GlyphProviderProps {
  children: ReactNode;
}

export function GlyphProvider({children}: GlyphProviderProps) {
  const [glyphDatabase, setGlyphDatabase] = useState<Record<string, GlyphData>>({});
  const [text, setText] = useState<CharInstance[]>([]);
  const [globalKerning, setGlobalKerning] = useState<number>(1.0);
  const [selectedCharIndex, setSelectedCharIndex] = useState<number | null>(null);

  // LocalStorageからグリフデータを読み込み
  useEffect(() => {
    try {
      const savedGlyphs = localStorage.getItem("glyphDatabase");
      if (savedGlyphs) {
        setGlyphDatabase(JSON.parse(savedGlyphs));
      }
    } catch (error) {
      console.error("Failed to load glyphs from LocalStorage:", error);
    }
  }, []);

  // グリフデータが変更されたらLocalStorageに保存
  useEffect(() => {
    try {
      if (Object.keys(glyphDatabase).length > 0) {
        localStorage.setItem("glyphDatabase", JSON.stringify(glyphDatabase));
      }
    } catch (error) {
      console.error("Failed to save glyphs to LocalStorage:", error);
    }
  }, [glyphDatabase]);

  const loadGlyph = useCallback((char: string, data: GlyphData) => {
    setGlyphDatabase((prev) => ({
      ...prev,
      [char]: data,
    }));
  }, []);

  const addChar = useCallback((char: string) => {
    setText((prev) => [
      ...prev,
      {
        char,
        rotation: 0,
        deformation: 1.0,
      },
    ]);
  }, []);

  const removeChar = useCallback((index: number) => {
    setText((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateCharRotation = useCallback((index: number, rotation: number) => {
    setText((prev) =>
      prev.map((item, i) =>
        i === index ? {...item, rotation} : item
      )
    );
  }, []);

  const updateCharDeformation = useCallback((index: number, deformation: number) => {
    setText((prev) =>
      prev.map((item, i) =>
        i === index ? {...item, deformation} : item
      )
    );
  }, []);

  const contextValue: GlyphContextType = {
    glyphDatabase,
    loadGlyph,
    text,
    addChar,
    removeChar,
    updateCharRotation,
    updateCharDeformation,
    setText,
    globalKerning,
    setGlobalKerning,
    selectedCharIndex,
    setSelectedCharIndex,
  };

  return (
    <GlyphContext.Provider value={contextValue}>
      {children}
    </GlyphContext.Provider>
  );
}

// カスタムフック
export function useGlyph() {
  const context = useContext(GlyphContext);
  if (context === undefined) {
    throw new Error("useGlyph must be used within a GlyphProvider");
  }
  return context;
}
