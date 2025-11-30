"use client";

import React, {useEffect, useCallback} from "react";
import {useGlyph} from "../contexts/GlyphContext";
import GlyphRenderer from "./GlyphRenderer";
import styles from "./TextEditor.module.css";

export default function TextEditor() {
  const {
    glyphDatabase,
    text,
    addChar,
    removeChar,
    selectedCharIndex,
    setSelectedCharIndex,
    globalKerning,
  } = useGlyph();

  // キーボード入力のハンドリング
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Backspace
      if (e.key === "Backspace") {
        e.preventDefault();
        if (text.length > 0) {
          if (selectedCharIndex !== null && selectedCharIndex >= 0) {
            removeChar(selectedCharIndex);
            setSelectedCharIndex(
              selectedCharIndex > 0 ? selectedCharIndex - 1 : null
            );
          } else {
            removeChar(text.length - 1);
          }
        }
        return;
      }

      // Delete
      if (e.key === "Delete") {
        e.preventDefault();
        if (selectedCharIndex !== null && selectedCharIndex < text.length) {
          removeChar(selectedCharIndex);
          setSelectedCharIndex(
            selectedCharIndex < text.length - 1 ? selectedCharIndex : null
          );
        }
        return;
      }

      // 左右矢印キーで選択を移動
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (selectedCharIndex === null) {
          setSelectedCharIndex(text.length - 1);
        } else if (selectedCharIndex > 0) {
          setSelectedCharIndex(selectedCharIndex - 1);
        }
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (selectedCharIndex === null) {
          setSelectedCharIndex(0);
        } else if (selectedCharIndex < text.length - 1) {
          setSelectedCharIndex(selectedCharIndex + 1);
        }
        return;
      }

      // 通常の文字入力
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const char = e.key;

        // グリフが存在する場合のみ追加
        if (glyphDatabase[char]) {
          addChar(char);
        } else {
          console.warn(`Glyph for character "${char}" not found`);
        }
      }
    },
    [
      text,
      addChar,
      removeChar,
      selectedCharIndex,
      setSelectedCharIndex,
      glyphDatabase,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className={styles.container}>
      <div className={styles.canvas}>
        {text.length === 0 ? (
          <div className={styles.placeholder}>
            キーボードで文字を入力してください
          </div>
        ) : (
          <div className={styles.textLine}>
            {text.map((charInstance, index) => {
              const glyph = glyphDatabase[charInstance.char];
              if (!glyph) return null;

              return (
                <div
                  key={index}
                  className={styles.glyphWrapper}
                  style={{
                    marginRight: `${globalKerning * 10}px`,
                  }}
                >
                  <GlyphRenderer
                    glyph={glyph}
                    rotation={charInstance.rotation}
                    deformation={charInstance.deformation}
                    size={200}
                    onClick={() => setSelectedCharIndex(index)}
                    isSelected={selectedCharIndex === index}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.info}>
        <p>文字数: {text.length}</p>
        <p>
          登録済みグリフ: {Object.keys(glyphDatabase).length}文字 (
          {Object.keys(glyphDatabase).join(", ")})
        </p>
        {selectedCharIndex !== null && (
          <p>選択中: {text[selectedCharIndex]?.char}</p>
        )}
      </div>
    </div>
  );
}
