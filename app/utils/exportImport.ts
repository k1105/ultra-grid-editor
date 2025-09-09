import JSZip from "jszip";

// エクスポートデータの型定義
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

// 統合エクスポート処理（ZIP形式でSVGとJSONを同時ダウンロード）
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
  },
  exportFileName: string
): Promise<void> => {
  const zip = new JSZip();

  // JSONデータの準備
  const exportData: ExportData = {
    version: "1.0.0",
    gridInfo: {
      pixW: state.pixW,
      pixH: state.pixH,
      gapX: state.gapX,
      gapY: state.gapY,
      gridSize: state.gridSize,
    },
    canvasState: {
      widthPercent: state.canvasWidthPercent,
      heightPercent: state.canvasHeightPercent,
      zoom: state.zoom,
      showGuides: state.showGuides,
    },
    pixelData: compressPixelData(state.pixelGrid),
    exportDate: new Date().toISOString(),
    // アスペクト比情報を追加（後方互換性のため）
    aspectRatio: state.pixW / state.pixH,
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
  zip.file(`${exportFileName}.json`, JSON.stringify(exportData, null, 2));
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

// Fibonacciスパイラル用の統合エクスポート処理
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

  // JSONデータの準備
  const exportData: FibonacciExportData = {
    version: "1.0.0",
    spiralInfo: {
      numberOfCircles: state.numberOfCircles,
      spread: state.spread,
      rotationAngle: state.rotationAngle,
      deformationStrength: state.deformationStrength,
      dotRadius: state.dotRadius,
    },
    canvasState: {
      widthPercent: state.canvasWidthPercent,
      heightPercent: state.canvasHeightPercent,
      zoom: state.zoom,
    },
    dotStates: state.dotStates,
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
  zip.file(`${exportFileName}.json`, JSON.stringify(exportData, null, 2));
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

// Fibonacciスパイラル用のインポート処理
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

// インポート処理
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
