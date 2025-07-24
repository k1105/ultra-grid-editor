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
