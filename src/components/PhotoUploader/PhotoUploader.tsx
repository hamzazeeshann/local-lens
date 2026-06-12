"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./PhotoUploader.module.css";

interface PhotoUploaderProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
}

export default function PhotoUploader({ files, onChange, maxFiles = 5 }: PhotoUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const addFiles = (incoming: FileList | File[]) => {
    const list = Array.from(incoming);
    const images = list.filter((f) => f.type.startsWith("image/"));
    const merged = [...files, ...images].slice(0, maxFiles);
    if (merged.length < files.length + images.length) {
      setError(`Max ${maxFiles} photos`);
    } else {
      setError(null);
    }
    onChange(merged);
  };

  const removeAt = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    onChange(next);
  };

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.dropzone} ${dragOver ? styles.dragOver : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
      >
        <input
          className={styles.fileInput}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.currentTarget.value = "";
          }}
        />
        <div className={styles.dropText}>
          <strong>Drag & drop photos</strong>
          <span>or click to upload (up to {maxFiles})</span>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {files.length > 0 && (
        <div className={styles.grid}>
          {files.map((file, i) => (
            <div key={`${file.name}-${i}`} className={styles.card}>
              <img src={previews[i]} alt={file.name} className={styles.image} />
              <button type="button" className={styles.remove} onClick={() => removeAt(i)}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
