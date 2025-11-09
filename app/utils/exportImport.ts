import JSZip from "jszip";

// 新しいデータ構造の型定義

// glyph.json の型定義（セル情報とキャンバスサイズ）
export interface GlyphData {
  version: string;
  mode: "pixel" | "fibonacci" | "circle";
  canvasSize: {
    width: number;
    height: number;
  };
  // ピクセルモード用
  pixelData?: {
    gridSize: number;
    pixelData: string[]; // 16進数文字列の配列
  };
  // フィボナッチモード用
  fibonacciData?: {
    numberOfCircles: number;
    dotStates: boolean[];
  };
  // Circleモード用
  circleData?: {
    layers: number;
    dotStates: boolean[];
  };
  exportDate: string;
}

// style.json の型定義（グリッド設定とその他）
export interface StyleData {
  version: string;
  mode: "pixel" | "fibonacci" | "circle";
  // ピクセルモード用
  pixelStyle?: {
    pixW: number;
    pixH: number;
    gapX: number;
    gapY: number;
    canvasWidthPercent: number;
    canvasHeightPercent: number;
    zoom: number;
    showGuides: boolean;
    backgroundImage?: string;
    backgroundOpacity: number;
    backgroundImageScale: number;
    aspectRatio: number;
  };
  // フィボナッチモード用
  fibonacciStyle?: {
    spread: number;
    rotationAngle: number;
    deformationStrength: number;
    dotRadius: number;
    canvasWidthPercent: number;
    canvasHeightPercent: number;
    zoom: number;
  };
  // Circleモード用
  circleStyle?: {
    radius: number;
    spacingFactor: number;
    rotationAngle: number;
    deformationStrength: number;
    canvasWidthPercent: number;
    canvasHeightPercent: number;
    zoom: number;
  };
  exportDate: string;
}

// 後方互換性のための古いエクスポートデータの型定義
export interface ExportData {
  version: string;
  gridInfo: {
    pixW: number;
    pixH: number;
    gapX: number;
    gapY: number;
    gridSize: number;
  };
  canvasState: {
    widthPercent: number;
    heightPercent: number;
    zoom: number;
    showGuides: boolean;
  };
  pixelData: string[]; // 16進数文字列の配列
  exportDate: string;
  // アスペクト比情報を追加（後方互換性のため）
  aspectRatio?: number;
}

// ピクセルデータを16進数に圧縮する関数
export const compressPixelData = (pixelGrid: boolean[][]): string[] => {
  return pixelGrid.map((row) => {
    let hexString = "";
    for (let i = 0; i < row.length; i += 4) {
      let byte = 0;
      for (let j = 0; j < 4 && i + j < row.length; j++) {
        if (row[i + j]) {
          byte |= 1 << (3 - j);
        }
      }
      hexString += byte.toString(16).padStart(1, "0");
    }
    return hexString;
  });
};

// 16進数からピクセルデータを復元する関数
export const decompressPixelData = (
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

// ピクセルグリッドからSVGパスを生成する関数
export const generateSVGPath = (
  pixelGrid: boolean[][],
  pixW: number,
  pixH: number,
  gapX: number,
  gapY: number
): string => {
  const paths: string[] = [];
  const rows = pixelGrid.length;
  const cols = pixelGrid[0].length;

  // 各ピクセルをチェックして、塗りつぶされているピクセルの矩形パスを生成
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (pixelGrid[row][col]) {
        const x = col * (pixW + gapX);
        const y = row * (pixH + gapY);
        const path = `M ${x} ${y} h ${pixW} v ${pixH} h -${pixW} Z`;
        paths.push(path);
      }
    }
  }

  return paths.join(" ");
};

// SVGファイルを生成する関数
export const generateSVG = (
  pixelGrid: boolean[][],
  pixW: number,
  pixH: number,
  gapX: number,
  gapY: number
): string => {
  const rows = pixelGrid.length;
  const cols = pixelGrid[0].length;
  const width = cols * (pixW + gapX) - gapX;
  const height = rows * (pixH + gapY) - gapY;
  const pathData = generateSVGPath(pixelGrid, pixW, pixH, gapX, gapY);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <path d="${pathData}" fill="black" stroke="none"/>
</svg>`;
};

// ピクセルモード用エクスポート処理
export const exportToZip = async (
  state: {
    pixW: number;
    pixH: number;
    gapX: number;
    gapY: number;
    gridSize: number;
    canvasWidthPercent: number;
    canvasHeightPercent: number;
    zoom: number;
    showGuides: boolean;
    pixelGrid: boolean[][];
    backgroundImage?: string;
    backgroundOpacity: number;
    backgroundImageScale: number;
  },
  exportFileName: string
): Promise<void> => {
  const zip = new JSZip();

  // glyph.json の準備
  const glyphData: GlyphData = {
    version: "2.0.0",
    mode: "pixel",
    canvasSize: {
      width: state.gridSize * (state.pixW + state.gapX) - state.gapX,
      height: state.gridSize * (state.pixH + state.gapY) - state.gapY,
    },
    pixelData: {
      gridSize: state.gridSize,
      pixelData: compressPixelData(state.pixelGrid),
    },
    exportDate: new Date().toISOString(),
  };

  // style.json の準備
  const styleData: StyleData = {
    version: "2.0.0",
    mode: "pixel",
    pixelStyle: {
      pixW: state.pixW,
      pixH: state.pixH,
      gapX: state.gapX,
      gapY: state.gapY,
      canvasWidthPercent: state.canvasWidthPercent,
      canvasHeightPercent: state.canvasHeightPercent,
      zoom: state.zoom,
      showGuides: state.showGuides,
      backgroundImage: state.backgroundImage,
      backgroundOpacity: state.backgroundOpacity,
      backgroundImageScale: state.backgroundImageScale,
      aspectRatio: state.pixW / state.pixH,
    },
    exportDate: new Date().toISOString(),
  };

  // SVGデータの準備
  const svgContent = generateSVG(
    state.pixelGrid,
    state.pixW,
    state.pixH,
    state.gapX,
    state.gapY
  );

  // ZIPファイルにファイルを追加
  zip.file(`${exportFileName}-glyph.json`, JSON.stringify(glyphData, null, 2));
  zip.file(`${exportFileName}-style.json`, JSON.stringify(styleData, null, 2));
  zip.file(`${exportFileName}.svg`, svgContent);

  // ZIPファイルを生成してダウンロード
  try {
    const zipBlob = await zip.generateAsync({type: "blob"});
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFileName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to generate ZIP file:", error);
    throw new Error("エクスポートに失敗しました");
  }
};

// Fibonacciスパイラル用のエクスポートデータの型定義
export interface FibonacciExportData {
  version: string;
  spiralInfo: {
    numberOfCircles: number;
    spread: number;
    rotationAngle: number;
    deformationStrength: number;
    dotRadius: number;
  };
  canvasState: {
    widthPercent: number;
    heightPercent: number;
    zoom: number;
  };
  dotStates: boolean[];
  exportDate: string;
}

// FibonacciスパイラルからSVGパスを生成する関数
export const generateFibonacciSVGPath = (
  dotStates: boolean[],
  numberOfCircles: number,
  spread: number,
  rotationAngle: number,
  deformationStrength: number,
  dotRadius: number
): string => {
  const paths: string[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const rotationAngleRad = (rotationAngle * Math.PI) / 180;

  for (let i = 0; i < Math.min(numberOfCircles, dotStates.length); i++) {
    if (dotStates[i]) {
      // Fibonacciスパイラルの座標計算
      const radius = spread * Math.sqrt(i) * 2.2;
      const theta = i * goldenAngle;
      const x_rel = radius * Math.cos(theta);
      const y_rel = radius * Math.sin(theta);

      // 回転を適用
      const cos_a = Math.cos(-rotationAngleRad);
      const sin_a = Math.sin(-rotationAngleRad);
      const x_rot = x_rel * cos_a - y_rel * sin_a;
      const y_rot = x_rel * sin_a + y_rel * cos_a;

      // 変形を適用
      const x_stretched = x_rot * deformationStrength;
      const y_stretched = y_rot;

      // 逆回転を適用
      const cos_b = Math.cos(rotationAngleRad);
      const sin_b = Math.sin(rotationAngleRad);
      const x_final_rel = x_stretched * cos_b - y_stretched * sin_b;
      const y_final_rel = x_stretched * sin_b + y_stretched * cos_b;

      // 最終座標（中心を原点として）
      const x = x_final_rel;
      const y = y_final_rel;

      // ドットの半径
      const radius_final = spread * dotRadius;

      // 円のパスを生成
      const path = `M ${
        x - radius_final
      } ${y} A ${radius_final} ${radius_final} 0 1 1 ${
        x + radius_final
      } ${y} A ${radius_final} ${radius_final} 0 1 1 ${
        x - radius_final
      } ${y} Z`;
      paths.push(path);
    }
  }

  return paths.join(" ");
};

// Fibonacciスパイラル用のSVGファイルを生成する関数
export const generateFibonacciSVG = (
  dotStates: boolean[],
  numberOfCircles: number,
  spread: number,
  rotationAngle: number,
  deformationStrength: number,
  dotRadius: number
): string => {
  // 最大範囲を計算してSVGのサイズを決定
  const maxRadius =
    spread *
    Math.sqrt(numberOfCircles - 1) *
    2.2 *
    Math.max(deformationStrength, 1);
  const svgSize = Math.ceil(maxRadius * 2.5); // 余白を含める
  const center = svgSize / 2;

  const pathData = generateFibonacciSVGPath(
    dotStates,
    numberOfCircles,
    spread,
    rotationAngle,
    deformationStrength,
    dotRadius
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(${center}, ${center})">
    <path d="${pathData}" fill="black" stroke="none"/>
  </g>
</svg>`;
};

// フィボナッチモード用エクスポート処理
export const exportFibonacciToZip = async (
  state: {
    numberOfCircles: number;
    spread: number;
    rotationAngle: number;
    deformationStrength: number;
    dotRadius: number;
    dotStates: boolean[];
    canvasWidthPercent: number;
    canvasHeightPercent: number;
    zoom: number;
  },
  exportFileName: string
): Promise<void> => {
  const zip = new JSZip();

  // 最大範囲を計算してキャンバスサイズを決定
  const maxRadius =
    state.spread *
    Math.sqrt(state.numberOfCircles - 1) *
    2.2 *
    Math.max(state.deformationStrength, 1);
  const canvasSize = Math.ceil(maxRadius * 2.5); // 余白を含める

  // glyph.json の準備
  const glyphData: GlyphData = {
    version: "2.0.0",
    mode: "fibonacci",
    canvasSize: {
      width: canvasSize,
      height: canvasSize,
    },
    fibonacciData: {
      numberOfCircles: state.numberOfCircles,
      dotStates: state.dotStates,
    },
    exportDate: new Date().toISOString(),
  };

  // style.json の準備
  const styleData: StyleData = {
    version: "2.0.0",
    mode: "fibonacci",
    fibonacciStyle: {
      spread: state.spread,
      rotationAngle: state.rotationAngle,
      deformationStrength: state.deformationStrength,
      dotRadius: state.dotRadius,
      canvasWidthPercent: state.canvasWidthPercent,
      canvasHeightPercent: state.canvasHeightPercent,
      zoom: state.zoom,
    },
    exportDate: new Date().toISOString(),
  };

  // SVGデータの準備
  const svgContent = generateFibonacciSVG(
    state.dotStates,
    state.numberOfCircles,
    state.spread,
    state.rotationAngle,
    state.deformationStrength,
    state.dotRadius
  );

  // ZIPファイルにファイルを追加
  zip.file(`${exportFileName}-glyph.json`, JSON.stringify(glyphData, null, 2));
  zip.file(`${exportFileName}-style.json`, JSON.stringify(styleData, null, 2));
  zip.file(`${exportFileName}.svg`, svgContent);

  // ZIPファイルを生成してダウンロード
  try {
    const zipBlob = await zip.generateAsync({type: "blob"});
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFileName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to generate ZIP file:", error);
    throw new Error("エクスポートに失敗しました");
  }
};

// 新しい形式でのフィボナッチモード用インポート処理（glyph.json + style.json）
export const importFibonacciFromFilesV2 = async (
  glyphFile: File,
  styleFile: File,
  callbacks: {
    setNumberOfCircles: (value: number) => void;
    setSpread: (value: number) => void;
    setRotationAngle: (value: number) => void;
    setDeformationStrength: (value: number) => void;
    setDotRadius: (value: number) => void;
    setCanvasWidthPercent: (value: number) => void;
    setCanvasHeightPercent: (value: number) => void;
    setZoom: (value: number) => void;
    setDotStates: (states: boolean[]) => void;
  }
): Promise<void> => {
  try {
    // glyph.json を読み込み
    const glyphData = await new Promise<GlyphData>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string) as GlyphData;
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
      reader.readAsText(glyphFile);
    });

    // style.json を読み込み
    const styleData = await new Promise<StyleData>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string) as StyleData;
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
      reader.readAsText(styleFile);
    });

    // ドット情報を更新
    if (glyphData.fibonacciData) {
      callbacks.setNumberOfCircles(glyphData.fibonacciData.numberOfCircles);
      callbacks.setDotStates(glyphData.fibonacciData.dotStates);
    }

    // スタイル情報を更新
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
    console.error("Failed to import files:", error);
    throw error;
  }
};

// 後方互換性のための古い形式でのフィボナッチインポート処理
export const importFibonacciFromFile = (
  file: File,
  callbacks: {
    setNumberOfCircles: (value: number) => void;
    setSpread: (value: number) => void;
    setRotationAngle: (value: number) => void;
    setDeformationStrength: (value: number) => void;
    setDotRadius: (value: number) => void;
    setCanvasWidthPercent: (value: number) => void;
    setCanvasHeightPercent: (value: number) => void;
    setZoom: (value: number) => void;
    setDotStates: (states: boolean[]) => void;
  }
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(
          event.target?.result as string
        ) as FibonacciExportData;

        // バージョンチェック
        if (!data.version) {
          throw new Error("Invalid file format: missing version");
        }

        // スパイラル情報を更新
        if (data.spiralInfo) {
          callbacks.setNumberOfCircles(data.spiralInfo.numberOfCircles);
          callbacks.setSpread(data.spiralInfo.spread);
          callbacks.setRotationAngle(data.spiralInfo.rotationAngle);
          callbacks.setDeformationStrength(data.spiralInfo.deformationStrength);
          callbacks.setDotRadius(data.spiralInfo.dotRadius);
        }

        // キャンバス状態を更新
        if (data.canvasState) {
          callbacks.setCanvasWidthPercent(data.canvasState.widthPercent);
          callbacks.setCanvasHeightPercent(data.canvasState.heightPercent);
          callbacks.setZoom(data.canvasState.zoom);
        }

        // ドット状態を更新
        if (data.dotStates) {
          callbacks.setDotStates(data.dotStates);
        }

        resolve();
      } catch (error) {
        console.error("Failed to parse JSON file:", error);
        reject(new Error("無効なファイル形式です"));
      }
    };
    reader.onerror = () =>
      reject(new Error("ファイルの読み込みに失敗しました"));
    reader.readAsText(file);
  });
};

// 新しい形式でのピクセルモード用インポート処理（glyph.json + style.json）
export const importPixelFromFilesV2 = async (
  glyphFile: File,
  styleFile: File,
  callbacks: {
    setPixW: (value: number) => void;
    setPixH: (value: number) => void;
    setGapX: (value: number) => void;
    setGapY: (value: number) => void;
    updateGridSize: (size: number) => void;
    setCanvasWidthPercent: (value: number) => void;
    setCanvasHeightPercent: (value: number) => void;
    setZoom: (value: number) => void;
    setShowGuides: (value: boolean) => void;
    setPixelGrid: (grid: boolean[][]) => void;
    setBackgroundImage?: (image: string) => void;
    setBackgroundOpacity?: (opacity: number) => void;
    setBackgroundImageScale?: (scale: number) => void;
  }
): Promise<void> => {
  try {
    // glyph.json を読み込み
    const glyphData = await new Promise<GlyphData>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string) as GlyphData;
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
      reader.readAsText(glyphFile);
    });

    // style.json を読み込み
    const styleData = await new Promise<StyleData>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string) as StyleData;
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
      reader.readAsText(styleFile);
    });

    // グリッド情報を更新
    if (glyphData.pixelData) {
      callbacks.updateGridSize(glyphData.pixelData.gridSize);
      if (glyphData.pixelData.pixelData) {
        callbacks.setPixelGrid(
          decompressPixelData(
            glyphData.pixelData.pixelData,
            glyphData.pixelData.gridSize
          )
        );
      }
    }

    // スタイル情報を更新
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
    console.error("Failed to import files:", error);
    throw error;
  }
};

// 後方互換性のための古い形式でのインポート処理
export const importFromFile = (
  file: File,
  callbacks: {
    setPixW: (value: number) => void;
    setPixH: (value: number) => void;
    setGapX: (value: number) => void;
    setGapY: (value: number) => void;
    updateGridSize: (size: number) => void;
    setCanvasWidthPercent: (value: number) => void;
    setCanvasHeightPercent: (value: number) => void;
    setZoom: (value: number) => void;
    setShowGuides: (value: boolean) => void;
    setPixelGrid: (grid: boolean[][]) => void;
  }
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as ExportData;

        // バージョンチェック
        if (!data.version) {
          throw new Error("Invalid file format: missing version");
        }

        // グリッド情報を更新
        if (data.gridInfo) {
          callbacks.setPixW(data.gridInfo.pixW);
          callbacks.setPixH(data.gridInfo.pixH);
          callbacks.setGapX(data.gridInfo.gapX);
          callbacks.setGapY(data.gridInfo.gapY);
          callbacks.updateGridSize(data.gridInfo.gridSize);
        }

        // キャンバス状態を更新
        if (data.canvasState) {
          callbacks.setCanvasWidthPercent(data.canvasState.widthPercent);
          callbacks.setCanvasHeightPercent(data.canvasState.heightPercent);
          callbacks.setZoom(data.canvasState.zoom);
          callbacks.setShowGuides(data.canvasState.showGuides);
        }

        // ピクセルデータを更新
        if (data.pixelData) {
          callbacks.setPixelGrid(
            decompressPixelData(data.pixelData, data.gridInfo.gridSize)
          );
        }

        resolve();
      } catch (error) {
        console.error("Failed to parse JSON file:", error);
        reject(new Error("無効なファイル形式です"));
      }
    };
    reader.onerror = () =>
      reject(new Error("ファイルの読み込みに失敗しました"));
    reader.readAsText(file);
  });
};

// ファイル形式の自動検出とスマートなimport処理
export const smartImportPixel = async (
  file: File,
  callbacks: {
    setPixW: (value: number) => void;
    setPixH: (value: number) => void;
    setGapX: (value: number) => void;
    setGapY: (value: number) => void;
    updateGridSize: (size: number) => void;
    setCanvasWidthPercent: (value: number) => void;
    setCanvasHeightPercent: (value: number) => void;
    setZoom: (value: number) => void;
    setShowGuides: (value: boolean) => void;
    setPixelGrid: (grid: boolean[][]) => void;
    setBackgroundImage?: (image: string) => void;
    setBackgroundOpacity?: (opacity: number) => void;
    setBackgroundImageScale?: (scale: number) => void;
  }
): Promise<void> => {
  // ファイル名から形式を推測
  const fileName = file.name.toLowerCase();

  if (fileName.includes("-glyph.json")) {
    throw new Error(
      "新しい形式では、glyph.jsonとstyle.jsonの両方のファイルが必要です。両方のファイルを選択してください。"
    );
  }

  if (fileName.includes("-style.json")) {
    throw new Error(
      "新しい形式では、glyph.jsonとstyle.jsonの両方のファイルが必要です。両方のファイルを選択してください。"
    );
  }

  // 古い形式として処理
  return importFromFile(file, callbacks);
};

// 複数ファイルでのスマートなimport処理
export const smartImportPixelMultiple = async (
  files: File[],
  callbacks: {
    setPixW: (value: number) => void;
    setPixH: (value: number) => void;
    setGapX: (value: number) => void;
    setGapY: (value: number) => void;
    updateGridSize: (size: number) => void;
    setCanvasWidthPercent: (value: number) => void;
    setCanvasHeightPercent: (value: number) => void;
    setZoom: (value: number) => void;
    setShowGuides: (value: boolean) => void;
    setPixelGrid: (grid: boolean[][]) => void;
    setBackgroundImage?: (image: string) => void;
    setBackgroundOpacity?: (opacity: number) => void;
    setBackgroundImageScale?: (scale: number) => void;
  }
): Promise<void> => {
  if (files.length === 1) {
    return smartImportPixel(files[0], callbacks);
  }

  if (files.length === 2) {
    // ファイル名からglyphとstyleを特定
    let glyphFile: File | null = null;
    let styleFile: File | null = null;

    for (const file of files) {
      const fileName = file.name.toLowerCase();
      if (fileName.includes("-glyph.json")) {
        glyphFile = file;
      } else if (fileName.includes("-style.json")) {
        styleFile = file;
      }
    }

    if (glyphFile && styleFile) {
      return importPixelFromFilesV2(glyphFile, styleFile, callbacks);
    }
  }

  throw new Error(
    "無効なファイル選択です。単一の古い形式ファイル、または新しい形式のglyph.jsonとstyle.jsonの両方を選択してください。"
  );
};

// フィボナッチモード用のスマートなimport処理
export const smartImportFibonacci = async (
  file: File,
  callbacks: {
    setNumberOfCircles: (value: number) => void;
    setSpread: (value: number) => void;
    setRotationAngle: (value: number) => void;
    setDeformationStrength: (value: number) => void;
    setDotRadius: (value: number) => void;
    setCanvasWidthPercent: (value: number) => void;
    setCanvasHeightPercent: (value: number) => void;
    setZoom: (value: number) => void;
    setDotStates: (states: boolean[]) => void;
  }
): Promise<void> => {
  // ファイル名から形式を推測
  const fileName = file.name.toLowerCase();

  if (fileName.includes("-glyph.json")) {
    throw new Error(
      "新しい形式では、glyph.jsonとstyle.jsonの両方のファイルが必要です。両方のファイルを選択してください。"
    );
  }

  if (fileName.includes("-style.json")) {
    throw new Error(
      "新しい形式では、glyph.jsonとstyle.jsonの両方のファイルが必要です。両方のファイルを選択してください。"
    );
  }

  // 古い形式として処理
  return importFibonacciFromFile(file, callbacks);
};

// フィボナッチモード用の複数ファイルでのスマートなimport処理
export const smartImportFibonacciMultiple = async (
  files: File[],
  callbacks: {
    setNumberOfCircles: (value: number) => void;
    setSpread: (value: number) => void;
    setRotationAngle: (value: number) => void;
    setDeformationStrength: (value: number) => void;
    setDotRadius: (value: number) => void;
    setCanvasWidthPercent: (value: number) => void;
    setCanvasHeightPercent: (value: number) => void;
    setZoom: (value: number) => void;
    setDotStates: (states: boolean[]) => void;
  }
): Promise<void> => {
  if (files.length === 1) {
    return smartImportFibonacci(files[0], callbacks);
  }

  if (files.length === 2) {
    // ファイル名からglyphとstyleを特定
    let glyphFile: File | null = null;
    let styleFile: File | null = null;

    for (const file of files) {
      const fileName = file.name.toLowerCase();
      if (fileName.includes("-glyph.json")) {
        glyphFile = file;
      } else if (fileName.includes("-style.json")) {
        styleFile = file;
      }
    }

    if (glyphFile && styleFile) {
      return importFibonacciFromFilesV2(glyphFile, styleFile, callbacks);
    }
  }

  throw new Error(
    "無効なファイル選択です。単一の古い形式ファイル、または新しい形式のglyph.jsonとstyle.jsonの両方を選択してください。"
  );
};

// CircleグリッドからSVGパスを生成する関数
export const generateCircleSVGPath = (
  dotStates: boolean[],
  layers: number,
  radius: number,
  spacingFactor: number,
  canvasSize: number
): string => {
  const paths: string[] = [];
  const centerX = canvasSize / 2;
  const centerY = canvasSize / 2;
  let dotIndex = 0;

  for (let i = 0; i < layers; i++) {
    const layerRadius = (i / (layers - 1)) * (canvasSize / 2.2);
    const circleSize = radius;
    const circumference = 2 * Math.PI * layerRadius;
    const circlesPerLayer = Math.max(
      6,
      Math.floor(circumference / (circleSize * spacingFactor))
    );

    for (let j = 0; j < circlesPerLayer; j++) {
      if (dotStates[dotIndex]) {
        const angle =
          (2 * Math.PI * j) / circlesPerLayer +
          ((i % 2) * Math.PI) / circlesPerLayer;
        const x = centerX + Math.cos(angle) * layerRadius;
        const y = centerY + Math.sin(angle) * layerRadius;

        // 円のパスを生成
        const r = circleSize / 2;
        const path = `M ${x - r} ${y} A ${r} ${r} 0 1 1 ${x + r} ${y} A ${r} ${r} 0 1 1 ${
          x - r
        } ${y} Z`;
        paths.push(path);
      }
      dotIndex++;
    }
  }

  return paths.join(" ");
};

// Circleグリッド用のSVGファイルを生成する関数
export const generateCircleSVG = (
  dotStates: boolean[],
  layers: number,
  radius: number,
  spacingFactor: number
): string => {
  // SVGのサイズを計算
  const svgSize = 800;

  const pathData = generateCircleSVGPath(
    dotStates,
    layers,
    radius,
    spacingFactor,
    svgSize
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" xmlns="http://www.w3.org/2000/svg">
  <path d="${pathData}" fill="black" stroke="none"/>
</svg>`;
};

// Circleモード用エクスポート処理
export const exportCircleToZip = async (
  state: {
    layers: number;
    radius: number;
    spacingFactor: number;
    rotationAngle: number;
    deformationStrength: number;
    dotStates: boolean[];
    canvasWidthPercent: number;
    canvasHeightPercent: number;
    zoom: number;
  },
  exportFileName: string
): Promise<void> => {
  const zip = new JSZip();

  // キャンバスサイズを決定
  const canvasSize = 800;

  // glyph.json の準備
  const glyphData: GlyphData = {
    version: "2.0.0",
    mode: "circle",
    canvasSize: {
      width: canvasSize,
      height: canvasSize,
    },
    circleData: {
      layers: state.layers,
      dotStates: state.dotStates,
    },
    exportDate: new Date().toISOString(),
  };

  // style.json の準備
  const styleData: StyleData = {
    version: "2.0.0",
    mode: "circle",
    circleStyle: {
      radius: state.radius,
      spacingFactor: state.spacingFactor,
      rotationAngle: state.rotationAngle,
      deformationStrength: state.deformationStrength,
      canvasWidthPercent: state.canvasWidthPercent,
      canvasHeightPercent: state.canvasHeightPercent,
      zoom: state.zoom,
    },
    exportDate: new Date().toISOString(),
  };

  // SVGデータの準備
  const svgContent = generateCircleSVG(
    state.dotStates,
    state.layers,
    state.radius,
    state.spacingFactor
  );

  // ZIPファイルにファイルを追加
  zip.file(`${exportFileName}-glyph.json`, JSON.stringify(glyphData, null, 2));
  zip.file(`${exportFileName}-style.json`, JSON.stringify(styleData, null, 2));
  zip.file(`${exportFileName}.svg`, svgContent);

  // ZIPファイルを生成してダウンロード
  try {
    const zipBlob = await zip.generateAsync({type: "blob"});
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFileName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to generate ZIP file:", error);
    throw new Error("エクスポートに失敗しました");
  }
};

// Circleモード用のインポート処理（glyph.json + style.json）
export const importCircleFromFilesV2 = async (
  glyphFile: File,
  styleFile: File,
  callbacks: {
    setLayers: (value: number) => void;
    setRadius: (value: number) => void;
    setSpacingFactor: (value: number) => void;
    setRotationAngle: (value: number) => void;
    setDeformationStrength: (value: number) => void;
    setCanvasWidthPercent: (value: number) => void;
    setCanvasHeightPercent: (value: number) => void;
    setZoom: (value: number) => void;
    setDotStates: (states: boolean[]) => void;
  }
): Promise<void> => {
  try {
    // glyph.json を読み込み
    const glyphData = await new Promise<GlyphData>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string) as GlyphData;
          if (!data.version || data.mode !== "circle") {
            throw new Error("Invalid glyph file format");
          }
          resolve(data);
        } catch {
          reject(new Error("無効なglyphファイル形式です"));
        }
      };
      reader.onerror = () =>
        reject(new Error("glyphファイルの読み込みに失敗しました"));
      reader.readAsText(glyphFile);
    });

    // style.json を読み込み
    const styleData = await new Promise<StyleData>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string) as StyleData;
          if (!data.version || data.mode !== "circle") {
            throw new Error("Invalid style file format");
          }
          resolve(data);
        } catch {
          reject(new Error("無効なstyleファイル形式です"));
        }
      };
      reader.onerror = () =>
        reject(new Error("styleファイルの読み込みに失敗しました"));
      reader.readAsText(styleFile);
    });

    // グリッド情報を更新
    if (glyphData.circleData) {
      callbacks.setLayers(glyphData.circleData.layers);
      callbacks.setDotStates(glyphData.circleData.dotStates);
    }

    // スタイル情報を更新
    if (styleData.circleStyle) {
      callbacks.setRadius(styleData.circleStyle.radius);
      callbacks.setSpacingFactor(styleData.circleStyle.spacingFactor);
      callbacks.setRotationAngle(styleData.circleStyle.rotationAngle);
      callbacks.setDeformationStrength(
        styleData.circleStyle.deformationStrength
      );
      callbacks.setCanvasWidthPercent(styleData.circleStyle.canvasWidthPercent);
      callbacks.setCanvasHeightPercent(
        styleData.circleStyle.canvasHeightPercent
      );
      callbacks.setZoom(styleData.circleStyle.zoom);
    }
  } catch (error) {
    console.error("Failed to import files:", error);
    throw error;
  }
};

// Circleモード用の複数ファイルでのスマートなimport処理
export const smartImportCircleMultiple = async (
  files: File[],
  callbacks: {
    setLayers: (value: number) => void;
    setRadius: (value: number) => void;
    setSpacingFactor: (value: number) => void;
    setRotationAngle: (value: number) => void;
    setDeformationStrength: (value: number) => void;
    setCanvasWidthPercent: (value: number) => void;
    setCanvasHeightPercent: (value: number) => void;
    setZoom: (value: number) => void;
    setDotStates: (states: boolean[]) => void;
  }
): Promise<void> => {
  if (files.length === 2) {
    // ファイル名からglyphとstyleを特定
    let glyphFile: File | null = null;
    let styleFile: File | null = null;

    for (const file of files) {
      const fileName = file.name.toLowerCase();
      if (fileName.includes("-glyph.json")) {
        glyphFile = file;
      } else if (fileName.includes("-style.json")) {
        styleFile = file;
      }
    }

    if (glyphFile && styleFile) {
      return importCircleFromFilesV2(glyphFile, styleFile, callbacks);
    }
  }

  throw new Error(
    "無効なファイル選択です。glyph.jsonとstyle.jsonの両方を選択してください。"
  );
};
