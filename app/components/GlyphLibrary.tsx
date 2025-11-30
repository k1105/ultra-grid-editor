"use client";

import React, {useCallback, useState} from "react";
import {useGlyph, type GlyphData} from "../contexts/GlyphContext";
import GlyphRenderer from "./GlyphRenderer";
import styles from "./GlyphLibrary.module.css";

// 配列形式のdotStatesをオブジェクト形式に変換する関数（矩形グリッド用）
function convertArrayToObjectDotStates(
  dotStatesArray: boolean[],
  layers: number,
  radius: number,
  spacingFactor: number,
  canvasSize: number = 800
): Record<string, boolean> {
  const dotStates: Record<string, boolean> = {};
  const circleSize = radius;
  const spacing = circleSize * spacingFactor;

  // CircleGridCanvasRendererと同じロジックを使用
  const maxRadius = canvasSize / 2.8;
  const gridSize = Math.ceil((maxRadius * 2) / spacing) + 2;

  let index = 0;
  for (let row = -gridSize; row <= gridSize; row++) {
    for (let col = -gridSize; col <= gridSize; col++) {
      const x_rel = col * spacing;
      const y_rel = row * spacing;

      // 円形クロップの判定
      const distFromCenter = Math.sqrt(x_rel * x_rel + y_rel * y_rel);
      if (distFromCenter > maxRadius) {
        continue; // 円の外側はスキップ
      }

      const key = `${row}:${col}`;
      if (index < dotStatesArray.length) {
        dotStates[key] = dotStatesArray[index];
      }
      index++;
    }
  }

  return dotStates;
}

export default function GlyphLibrary() {
  const {glyphDatabase, loadGlyph} = useGlyph();
  const [isOpen, setIsOpen] = useState(false);

  // グリフファイル（glyph.json）をインポート
  const handleImportGlyph = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        // glyph.jsonの形式をチェック（矩形グリッドのみ対応）
        if (data.mode === "circle" && data.circleData) {
          // 矩形グリッドのみ受け入れる
          if (data.circleStyle?.gridType !== "rectangular") {
            alert("矩形グリッド（rectangular）のglyph.jsonファイルのみ対応しています");
            return;
          }

          // 文字名を入力
          const charName = prompt(
            "この文字に割り当てるキー（1文字）を入力してください:",
            "あ"
          );
          if (!charName || charName.length !== 1) {
            alert("1文字のキーを入力してください");
            return;
          }

          // GlyphData形式に変換
          const radius = data.circleStyle?.radius || 20;
          const spacingFactor = data.circleStyle?.spacingFactor || 1.4;
          const layers = data.circleData.layers;

          // 配列形式かオブジェクト形式かを判定
          let dotStates: Record<string, boolean>;
          if (Array.isArray(data.circleData.dotStates)) {
            // 配列形式の場合、オブジェクト形式に変換
            const canvasSize = data.canvasSize?.width || 800;
            dotStates = convertArrayToObjectDotStates(
              data.circleData.dotStates,
              layers,
              radius,
              spacingFactor,
              canvasSize
            );
          } else {
            // すでにオブジェクト形式の場合
            dotStates = data.circleData.dotStates;
          }

          const glyphData: GlyphData = {
            char: charName,
            dotStates,
            layers,
            radius,
            spacingFactor,
            gridType: "rectangular",
          };

          loadGlyph(charName, glyphData);
          alert(`文字「${charName}」を登録しました`);
        } else {
          alert("矩形グリッドのglyph.jsonファイルを選択してください");
        }
      } catch (error) {
        console.error("Failed to import glyph:", error);
        alert("グリフのインポートに失敗しました");
      }
    };
    input.click();
  }, [loadGlyph]);

  // 複数のグリフファイルを一括インポート
  const handleBatchImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      let successCount = 0;
      let failCount = 0;

      for (const file of Array.from(files)) {
        try {
          const text = await file.text();
          const data = JSON.parse(text);

          if (data.mode === "circle" && data.circleData) {
            // 矩形グリッドのみ受け入れる
            if (data.circleStyle?.gridType !== "rectangular") {
              failCount++;
              continue;
            }

            // ファイル名から文字を抽出（例: あ-glyph.json → あ）
            const fileName = file.name.replace(/-glyph\.json$/, "");
            const charName = fileName.charAt(0);

            const radius = data.circleStyle?.radius || 20;
            const spacingFactor = data.circleStyle?.spacingFactor || 1.4;
            const layers = data.circleData.layers;

            // 配列形式かオブジェクト形式かを判定
            let dotStates: Record<string, boolean>;
            if (Array.isArray(data.circleData.dotStates)) {
              // 配列形式の場合、オブジェクト形式に変換
              const canvasSize = data.canvasSize?.width || 800;
              dotStates = convertArrayToObjectDotStates(
                data.circleData.dotStates,
                layers,
                radius,
                spacingFactor,
                canvasSize
              );
            } else {
              // すでにオブジェクト形式の場合
              dotStates = data.circleData.dotStates;
            }

            const glyphData: GlyphData = {
              char: charName,
              dotStates,
              layers,
              radius,
              spacingFactor,
              gridType: "rectangular",
            };

            loadGlyph(charName, glyphData);
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Failed to import ${file.name}:`, error);
          failCount++;
        }
      }

      alert(
        `インポート完了\n成功: ${successCount}件\n失敗: ${failCount}件`
      );
    };
    input.click();
  }, [loadGlyph]);

  return (
    <>
      <button
        className={styles.toggleButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        📚 グリフライブラリ ({Object.keys(glyphDatabase).length})
      </button>

      {isOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.header}>
              <h2>グリフライブラリ</h2>
              <button
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.actions}>
              <button
                className={styles.importButton}
                onClick={handleImportGlyph}
              >
                グリフをインポート
              </button>
              <button
                className={styles.importButton}
                onClick={handleBatchImport}
              >
                複数グリフを一括インポート
              </button>
            </div>

            <div className={styles.glyphGrid}>
              {Object.keys(glyphDatabase).length === 0 ? (
                <div className={styles.empty}>
                  <p>グリフが登録されていません</p>
                  <p>
                    矩形グリッドエディターで作成したglyph.jsonファイルをインポートするか、
                    public/glyphs/ディレクトリにファイルを配置してください
                  </p>
                </div>
              ) : (
                Object.entries(glyphDatabase).map(([char, glyph]) => (
                  <div key={char} className={styles.glyphItem}>
                    <div className={styles.glyphPreview}>
                      <GlyphRenderer
                        glyph={glyph}
                        rotation={0}
                        deformation={1}
                        size={80}
                      />
                    </div>
                    <div className={styles.glyphInfo}>
                      <span className={styles.charLabel}>{char}</span>
                      <span className={styles.charDetails}>
                        {glyph.gridType} / L{glyph.layers}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
