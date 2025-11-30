"use client";

import React from "react";
import {useGlyph} from "../contexts/GlyphContext";
import styles from "./TextEditorControls.module.css";

export default function TextEditorControls() {
  const {
    text,
    selectedCharIndex,
    updateCharRotation,
    updateCharDeformation,
    globalKerning,
    setGlobalKerning,
  } = useGlyph();

  const selectedChar =
    selectedCharIndex !== null ? text[selectedCharIndex] : null;

  return (
    <div className={styles.controls}>
      <div className={styles.section}>
        <h3>グローバル設定</h3>
        <label>
          カーニング（文字間隔）
          <div className={styles.sliderContainer}>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={globalKerning}
              onChange={(e) => setGlobalKerning(parseFloat(e.target.value))}
            />
            <span className={styles.value}>{globalKerning.toFixed(1)}</span>
          </div>
        </label>
      </div>

      {selectedChar && selectedCharIndex !== null && (
        <div className={styles.section}>
          <h3>選択中の文字: {selectedChar.char}</h3>

          <label>
            回転角度
            <div className={styles.sliderContainer}>
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={selectedChar.rotation}
                onChange={(e) =>
                  updateCharRotation(
                    selectedCharIndex,
                    parseFloat(e.target.value)
                  )
                }
              />
              <span className={styles.value}>
                {selectedChar.rotation.toFixed(0)}°
              </span>
            </div>
          </label>

          <label>
            変形強度
            <div className={styles.sliderContainer}>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={selectedChar.deformation}
                onChange={(e) =>
                  updateCharDeformation(
                    selectedCharIndex,
                    parseFloat(e.target.value)
                  )
                }
              />
              <span className={styles.value}>
                {selectedChar.deformation.toFixed(1)}
              </span>
            </div>
          </label>

          <button
            className={styles.resetButton}
            onClick={() => {
              updateCharRotation(selectedCharIndex, 0);
              updateCharDeformation(selectedCharIndex, 1.0);
            }}
          >
            リセット
          </button>
        </div>
      )}

      <div className={styles.section}>
        <h3>ヘルプ</h3>
        <ul className={styles.helpList}>
          <li>文字を入力: キーボードで直接入力</li>
          <li>文字を選択: クリックまたは矢印キー</li>
          <li>文字を削除: Backspace / Delete</li>
        </ul>
      </div>
    </div>
  );
}
