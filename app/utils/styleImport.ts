// styleのみをインポートする関数（ピクセルモード用）
export const importPixelStyleOnly = async (
  file: File,
  callbacks: {
    setPixW: (value: number) => void;
    setPixH: (value: number) => void;
    setGapX: (value: number) => void;
    setGapY: (value: number) => void;
    setCanvasWidthPercent: (value: number) => void;
    setCanvasHeightPercent: (value: number) => void;
    setZoom: (value: number) => void;
    setShowGuides: (value: boolean) => void;
    setBackgroundImage?: (image: string) => void;
    setBackgroundOpacity?: (opacity: number) => void;
    setBackgroundImageScale?: (scale: number) => void;
  }
): Promise<void> => {
  try {
    const styleData = await new Promise<any>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (!data.version || data.mode !== "pixel") {
            throw new Error("Invalid style file format");
          }
          resolve(data);
        } catch {
          reject(new Error("無効なstyleファイル形式です"));
        }
      };
      reader.onerror = () =>
        reject(new Error("styleファイルの読み込みに失敗しました"));
      reader.readAsText(file);
    });

    // スタイル情報のみを更新
    if (styleData.pixelStyle) {
      callbacks.setPixW(styleData.pixelStyle.pixW);
      callbacks.setPixH(styleData.pixelStyle.pixH);
      callbacks.setGapX(styleData.pixelStyle.gapX);
      callbacks.setGapY(styleData.pixelStyle.gapY);
      callbacks.setCanvasWidthPercent(styleData.pixelStyle.canvasWidthPercent);
      callbacks.setCanvasHeightPercent(
        styleData.pixelStyle.canvasHeightPercent
      );
      callbacks.setZoom(styleData.pixelStyle.zoom);
      callbacks.setShowGuides(styleData.pixelStyle.showGuides);

      if (
        callbacks.setBackgroundImage &&
        styleData.pixelStyle.backgroundImage
      ) {
        callbacks.setBackgroundImage(styleData.pixelStyle.backgroundImage);
      }
      if (callbacks.setBackgroundOpacity) {
        callbacks.setBackgroundOpacity(styleData.pixelStyle.backgroundOpacity);
      }
      if (callbacks.setBackgroundImageScale) {
        callbacks.setBackgroundImageScale(
          styleData.pixelStyle.backgroundImageScale
        );
      }
    }
  } catch (error) {
    console.error("Failed to import style file:", error);
    throw error;
  }
};

// styleのみをインポートする関数（フィボナッチモード用）
export const importFibonacciStyleOnly = async (
  file: File,
  callbacks: {
    setSpread: (value: number) => void;
    setRotationAngle: (value: number) => void;
    setDeformationStrength: (value: number) => void;
    setDotRadius: (value: number) => void;
    setCanvasWidthPercent: (value: number) => void;
    setCanvasHeightPercent: (value: number) => void;
    setZoom: (value: number) => void;
  }
): Promise<void> => {
  try {
    const styleData = await new Promise<any>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (!data.version || data.mode !== "fibonacci") {
            throw new Error("Invalid style file format");
          }
          resolve(data);
        } catch {
          reject(new Error("無効なstyleファイル形式です"));
        }
      };
      reader.onerror = () =>
        reject(new Error("styleファイルの読み込みに失敗しました"));
      reader.readAsText(file);
    });

    // スタイル情報のみを更新
    if (styleData.fibonacciStyle) {
      callbacks.setSpread(styleData.fibonacciStyle.spread);
      callbacks.setRotationAngle(styleData.fibonacciStyle.rotationAngle);
      callbacks.setDeformationStrength(
        styleData.fibonacciStyle.deformationStrength
      );
      callbacks.setDotRadius(styleData.fibonacciStyle.dotRadius);
      callbacks.setCanvasWidthPercent(
        styleData.fibonacciStyle.canvasWidthPercent
      );
      callbacks.setCanvasHeightPercent(
        styleData.fibonacciStyle.canvasHeightPercent
      );
      callbacks.setZoom(styleData.fibonacciStyle.zoom);
    }
  } catch (error) {
    console.error("Failed to import style file:", error);
    throw error;
  }
};

// glyphのみをインポートする関数（ピクセルモード用）
export const importPixelGlyphOnly = async (
  file: File,
  callbacks: {
    updateGridSize: (size: number) => void;
    setPixelGrid: (grid: boolean[][]) => void;
  }
): Promise<void> => {
  try {
    const glyphData = await new Promise<any>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (!data.version || data.mode !== "pixel") {
            throw new Error("Invalid glyph file format");
          }
          resolve(data);
        } catch {
          reject(new Error("無効なglyphファイル形式です"));
        }
      };
      reader.onerror = () =>
        reject(new Error("glyphファイルの読み込みに失敗しました"));
      reader.readAsText(file);
    });

    // glyph情報のみを更新
    if (glyphData.pixelData) {
      callbacks.updateGridSize(glyphData.pixelData.gridSize);
      if (glyphData.pixelData.pixelData) {
        // 16進数からピクセルデータを復元する関数（exportImport.tsからコピー）
        const decompressPixelData = (
          hexData: string[],
          gridSize: number
        ): boolean[][] => {
          const pixelGrid: boolean[][] = [];

          for (let row = 0; row < hexData.length; row++) {
            const hexString = hexData[row];
            const pixelRow: boolean[] = [];

            for (let i = 0; i < hexString.length; i++) {
              const byte = parseInt(hexString[i], 16);
              for (let j = 0; j < 4 && pixelRow.length < gridSize; j++) {
                pixelRow.push((byte & (1 << (3 - j))) !== 0);
              }
            }

            // グリッドサイズに合わせて調整
            while (pixelRow.length < gridSize) {
              pixelRow.push(false);
            }
            pixelGrid.push(pixelRow);
          }

          return pixelGrid;
        };

        callbacks.setPixelGrid(
          decompressPixelData(
            glyphData.pixelData.pixelData,
            glyphData.pixelData.gridSize
          )
        );
      }
    }
  } catch (error) {
    console.error("Failed to import glyph file:", error);
    throw error;
  }
};

// glyphのみをインポートする関数（フィボナッチモード用）
export const importFibonacciGlyphOnly = async (
  file: File,
  callbacks: {
    setNumberOfCircles: (value: number) => void;
    setDotStates: (states: boolean[]) => void;
  }
): Promise<void> => {
  try {
    const glyphData = await new Promise<any>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (!data.version || data.mode !== "fibonacci") {
            throw new Error("Invalid glyph file format");
          }
          resolve(data);
        } catch {
          reject(new Error("無効なglyphファイル形式です"));
        }
      };
      reader.onerror = () =>
        reject(new Error("glyphファイルの読み込みに失敗しました"));
      reader.readAsText(file);
    });

    // glyph情報のみを更新
    if (glyphData.fibonacciData) {
      callbacks.setNumberOfCircles(glyphData.fibonacciData.numberOfCircles);
      callbacks.setDotStates(glyphData.fibonacciData.dotStates);
    }
  } catch (error) {
    console.error("Failed to import glyph file:", error);
    throw error;
  }
};
