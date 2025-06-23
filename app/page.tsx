"use client";

import styles from "./page.module.css";
import PixelCanvas from "./components/PixelCanvas";
import EditorControls from "./components/EditorControls";
import PreviewWindows from "./components/PreviewWindows";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <EditorControls />
        <PixelCanvas className={styles.canvas} />
        <PreviewWindows />
      </main>
    </div>
  );
}
