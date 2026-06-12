"use client";

import React, { useEffect } from "react";
import styles from "./Toast.module.css";

export default function Toast({
  message,
  actionLabel,
  onAction,
  onClose,
  duration = 4000,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
  duration?: number;
}) {
  useEffect(() => {
    if (!onClose) return;
    const t = setTimeout(() => onClose(), duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <div className={styles.message}>{message}</div>
      {actionLabel && onAction && (
        <button className={styles.action} onClick={onAction}>
          {actionLabel}
        </button>
      )}
      {onClose && (
        <button className={styles.close} onClick={onClose} aria-label="close">
          ×
        </button>
      )}
    </div>
  );
}
