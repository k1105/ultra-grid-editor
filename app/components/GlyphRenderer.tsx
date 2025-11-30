"use client";

import React, {useEffect, useRef} from "react";
import type p5 from "p5";
import type {GlyphData} from "../contexts/GlyphContext";

interface GlyphRendererProps {
  glyph: GlyphData;
  rotation: number;
  deformation: number;
  size?: number;
  onClick?: () => void;
  isSelected?: boolean;
}

export default function GlyphRenderer({
  glyph,
  rotation,
  deformation,
  size = 100,
  onClick,
  isSelected = false,
}: GlyphRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // p5.jsを動的インポート
    import("p5").then((p5Module) => {
      const p5 = p5Module.default;

      const sketch = (p: p5) => {
        p.setup = () => {
          const canvas = p.createCanvas(size, size);
          canvas.parent(containerRef.current!);
          p.pixelDensity(1);
          p.noSmooth();
        };

        p.draw = () => {
          p.background(255);

          const centerX = size / 2;
          const centerY = size / 2;
          const rotationAngleRad = (rotation * Math.PI) / 180;

          // グリッド描画
          if (glyph.gridType === "honeycomb") {
            // ハニカムグリッド
            for (let i = 0; i < glyph.layers; i++) {
              const radius = p.map(i, 0, glyph.layers - 1, 0, size / 2.8);
              const circleSize = glyph.radius;
              const circumference = p.TWO_PI * radius;
              const circlesPerLayer = Math.max(
                6,
                Math.floor(circumference / (circleSize * glyph.spacingFactor))
              );

              for (let j = 0; j < circlesPerLayer; j++) {
                const angle =
                  (p.TWO_PI * j) / circlesPerLayer +
                  ((i % 2) * Math.PI) / circlesPerLayer;

                const x_rel = Math.cos(angle) * radius;
                const y_rel = Math.sin(angle) * radius;

                // 回転を適用
                const cos_a = Math.cos(-rotationAngleRad);
                const sin_a = Math.sin(-rotationAngleRad);
                const x_rot = x_rel * cos_a - y_rel * sin_a;
                const y_rot = x_rel * sin_a + y_rel * cos_a;

                // 変形を適用
                const x_stretched = x_rot * deformation;
                const y_stretched = y_rot;

                // 逆回転を適用
                const cos_b = Math.cos(rotationAngleRad);
                const sin_b = Math.sin(rotationAngleRad);
                const x_final_rel = x_stretched * cos_b - y_stretched * sin_b;
                const y_final_rel = x_stretched * sin_b + y_stretched * cos_b;

                const x = centerX + x_final_rel;
                const y = centerY + y_final_rel;

                const key = `${i}:${j}`;
                const isFilled = glyph.dotStates[key];

                p.push();
                p.noStroke();
                if (isFilled) {
                  p.fill(0);
                } else {
                  p.noFill();
                }
                p.circle(x, y, circleSize);
                p.pop();
              }
            }
          } else if (glyph.gridType === "rectangular") {
            // 矩形グリッド
            const circleSize = glyph.radius;
            const spacing = circleSize * glyph.spacingFactor;
            const maxRadius = size / 2.8;
            const gridSize = Math.ceil((maxRadius * 2) / spacing) + 2;

            for (let row = -gridSize; row <= gridSize; row++) {
              for (let col = -gridSize; col <= gridSize; col++) {
                const x_rel = col * spacing;
                const y_rel = row * spacing;

                const distFromCenter = Math.sqrt(
                  x_rel * x_rel + y_rel * y_rel
                );
                if (distFromCenter > maxRadius) {
                  continue;
                }

                // 回転を適用
                const cos_a = Math.cos(-rotationAngleRad);
                const sin_a = Math.sin(-rotationAngleRad);
                const x_rot = x_rel * cos_a - y_rel * sin_a;
                const y_rot = x_rel * sin_a + y_rel * cos_a;

                // 変形を適用
                const x_stretched = x_rot * deformation;
                const y_stretched = y_rot;

                // 逆回転を適用
                const cos_b = Math.cos(rotationAngleRad);
                const sin_b = Math.sin(rotationAngleRad);
                const x_final_rel = x_stretched * cos_b - y_stretched * sin_b;
                const y_final_rel = x_stretched * sin_b + y_stretched * cos_b;

                const x = centerX + x_final_rel;
                const y = centerY + y_final_rel;

                const key = `${row}:${col}`;
                const isFilled = glyph.dotStates[key];

                p.push();
                p.noStroke();
                if (isFilled) {
                  p.fill(0);
                } else {
                  p.noFill();
                }
                p.circle(x, y, circleSize);
                p.pop();
              }
            }
          }

          // 選択状態の表示
          if (isSelected) {
            p.noFill();
            p.stroke(0, 100, 255);
            p.strokeWeight(2);
            p.rect(0, 0, size, size);
          }
        };
      };

      p5InstanceRef.current = new p5(sketch);
    });

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, [glyph, rotation, deformation, size, isSelected]);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      style={{
        display: "inline-block",
        cursor: onClick ? "pointer" : "default",
      }}
    />
  );
}
