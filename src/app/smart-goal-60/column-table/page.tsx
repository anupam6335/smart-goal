'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function ColumnTable() {
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(4);

  const totalCells = rows * cols;

  const grid: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(c * rows + r + 1);
    }
    grid.push(row);
  }

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link href="/" className={styles.breadcrumbLink}>Home</Link>
        <span className={styles.breadcrumbSeparator}> / </span>
        <Link href="/smart-goal-60" className={styles.breadcrumbLink}>Frontend Mini‑Challenges</Link>
        <span className={styles.breadcrumbSeparator}> / </span>
        <span className={styles.breadcrumbCurrent}>Column Table</span>
      </div>

      <h1 className={styles.title}>Column Table</h1>
      <p className={styles.subtitle}>Adjust rows and columns to see the pattern.</p>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.label}>Rows: {rows}</label>
          <input
            type="range"
            min={2}
            max={8}
            value={rows}
            onChange={(e) => setRows(Number(e.target.value))}
            className={styles.slider}
          />
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.label}>Columns: {cols}</label>
          <input
            type="range"
            min={2}
            max={8}
            value={cols}
            onChange={(e) => setCols(Number(e.target.value))}
            className={styles.slider}
          />
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${cols}, 56px)`,
            gridTemplateRows: `repeat(${rows}, 56px)`,
          }}
        >
          {grid.map((row, rowIndex) =>
            row.map((num, colIndex) => (
              <div key={`${rowIndex}-${colIndex}`} className={styles.cell}>
                {num}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}