"use client";

import {useState} from "react";
import styles from "./page.module.css";
import PixelCanvas from "./components/PixelCanvas";
import EditorControls from "./components/EditorControls";
import PreviewWindows from "./components/PreviewWindows";
import ModeSelector from "./components/ModeSelector";
import {PixelEditorProvider} from "./contexts/PixelEditorContext";
import {FibonacciSpiralProvider} from "./contexts/FibonacciSpiralContext";

type Mode = "pixel" | "fibonacci";

export default function Home() {
  const [currentMode, setCurrentMode] = useState<Mode>("pixel");

  return (
    <PixelEditorProvider>
      <FibonacciSpiralProvider>
        <div className={styles.page}>
          <ModeSelector
            currentMode={currentMode}
            onModeChange={setCurrentMode}
            className={styles.modeSelector}
          />
          <main className={styles.main}>
            <EditorControls mode={currentMode} />
            <PixelCanvas className={styles.canvas} mode={currentMode} />
            {currentMode === "pixel" && <PreviewWindows />}
          </main>
        </div>
      </FibonacciSpiralProvider>
    </PixelEditorProvider>
  );
}
