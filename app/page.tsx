"use client";

import styles from "./page.module.css";
import PixelCanvas from "./components/PixelCanvas";
import EditorControls from "./components/EditorControls";
import PreviewWindows from "./components/PreviewWindows";
import {PixelEditorProvider} from "./contexts/PixelEditorContext";

export default function Home() {
  return (
    <PixelEditorProvider>
      <div className={styles.page}>
        <main className={styles.main}>
          <EditorControls />
          <PixelCanvas className={styles.canvas} />
          <PreviewWindows />
        </main>
      </div>
    </PixelEditorProvider>
  );
}
