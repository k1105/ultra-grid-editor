"use client";

import styles from "./ModeSelector.module.css";
import {Icon} from "@iconify/react/dist/iconify.js";

type Mode = "pixel" | "fibonacci" | "circle";

interface ModeSelectorProps {
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
  className?: string;
}

export default function ModeSelector({
  currentMode,
  onModeChange,
  className,
}: ModeSelectorProps) {
  return (
    <div className={`${styles.selector} ${className || ""}`}>
      <button
        onClick={() => onModeChange("pixel")}
        className={`${styles.modeButton} ${
          currentMode === "pixel" ? styles.active : ""
        }`}
      >
        <Icon icon="mdi:grid" />
        <span>Pixel Editor</span>
      </button>
      <button
        onClick={() => onModeChange("fibonacci")}
        className={`${styles.modeButton} ${
          currentMode === "fibonacci" ? styles.active : ""
        }`}
      >
        <Icon icon="mdi:circle-multiple" />
        <span>Fibonacci Spiral</span>
      </button>
      <button
        onClick={() => onModeChange("circle")}
        className={`${styles.modeButton} ${
          currentMode === "circle" ? styles.active : ""
        }`}
      >
        <Icon icon="mdi:circle-outline" />
        <span>Circle Grid</span>
      </button>
    </div>
  );
}
