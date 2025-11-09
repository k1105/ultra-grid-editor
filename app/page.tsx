"use client";

import {useState} from "react";
import styles from "./page.module.css";
import PixelCanvas from "./components/CanvasContainer";
import EditorControls from "./components/EditorControls";
// import PreviewWindows from "./components/PreviewWindows";
import ModeSelector from "./components/ModeSelector";
import {PixelEditorProvider} from "./contexts/PixelEditorContext";
import {FibonacciSpiralProvider} from "./contexts/FibonacciSpiralContext";
import {CircleGridProvider} from "./contexts/CircleGridContext";

type Mode = "pixel" | "fibonacci" | "circle";

export default function Home() {
  const [currentMode, setCurrentMode] = useState<Mode>("pixel");

  return (
    <div className={styles.page}>
      <PixelEditorProvider>
        <FibonacciSpiralProvider>
          <CircleGridProvider>
            <ModeSelector
              currentMode={currentMode}
              onModeChange={setCurrentMode}
              className={styles.modeSelector}
            />
            <main className={styles.main}>
              <EditorControls mode={currentMode} />
              <PixelCanvas className={styles.canvas} mode={currentMode} />
              {/* {currentMode === "pixel" && <PreviewWindows />} */}
            </main>
          </CircleGridProvider>
        </FibonacciSpiralProvider>
      </PixelEditorProvider>
    </div>
  );
}
