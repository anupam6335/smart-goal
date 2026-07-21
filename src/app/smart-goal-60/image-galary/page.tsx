'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

const images = [
  {
    id: 1,
    url: 'https://imgs.search.brave.com/bAdI7a7qnuuOIJphttt3DfbzLnCU7ZDMtnkejXq6UII/rs:fit:500:0:0/g:ce/aHR0cHM6Ly9zdDIu/ZGVwb3NpdHBob3Rv/cy5jb20vMTAwMDkz/OC81NDk5L2kvNDUw/L2RlcG9zaXRwaG90/b3NfNTQ5OTg2MTMt/c3RvY2stcGhvdG8t/Z2luZ2VyLWNhdC5q/cGc',
    alt: 'Ginger cat sitting',
  },
  {
    id: 2,
    url: 'https://imgs.search.brave.com/YzG9FgYN5qLWsiYyJ4dUEvxav9e98dBH0loR8YPRA1E/rs:fit:500:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTc0/ODc3NTY1L3Bob3Rv/L3BvcnRyYWl0LW9m/LWEtYnJvd24tY2F0/LWFnYWluc3QtYS1n/cmF5LWJhY2tncm91/bmQuanBnP3M9NjEy/eDYxMiZ3PTAmaz0y/MCZjPWlGcFFNSzlF/aTIzVm9XcExLa2Zh/TFVtdXN5Y3VaWllV/OWtWMjNzT2F6YzQ9',
    alt: 'Brown cat portrait',
  },
  {
    id: 3,
    url: 'https://imgs.search.brave.com/lZtf1S7JKFcaZs2lhxTpAtaJzTk_V35Xt8ys4htuVBU/rs:fit:500:0:0/g:ce/aHR0cHM6Ly9idXJz/dC5zaG9waWZ5Y2Ru/LmNvbS9waG90b3Mv/Y2F0LXBvc2VzLXBl/cmZlY3RseS5qcGc_/d2lkdGg9MTAwMCZm/b3JtYXQ9cGpwZyZl/eGlmPTAmaXB0Yz0w',
    alt: 'Cat in perfect pose',
  },
  {
    id: 4,
    url: 'https://imgs.search.brave.com/t6Nv0DwxoIACRxxtX2h7yt31ux5SCXHWgHVpoGh1diw/rs:fit:500:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzAyLzM2Lzk5LzIy/LzM2MF9GXzIzNjk5/MjI4M19zTk94Q1ZR/ZUZMZDVwZHFhS0do/OERSR01aeTdQNFhL/bS5qcGc',
    alt: 'Cat with expressive eyes',
  }
];

export default function ImageGallery() {
  const [selectedImage, setSelectedImage] = useState<typeof images[0] | null>(null);

  const handleClick = (image: typeof images[0]) => {
    setSelectedImage(selectedImage?.id === image.id ? null : image);
  };

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link href="/" className={styles.breadcrumbLink}>Home</Link>
        <span className={styles.breadcrumbSeparator}> / </span>
        <Link href="/smart-goal-60" className={styles.breadcrumbLink}>Frontend Mini‑Challenges</Link>
        <span className={styles.breadcrumbSeparator}> / </span>
        <span className={styles.breadcrumbCurrent}>Image Gallery</span>
      </div>

      <h1 className={styles.title}>Image Gallery</h1>
      <p className={styles.subtitle}>Click a thumbnail to view it larger below.</p>

      <div className={styles.grid}>
        {images.map((image) => (
          <div
            key={image.id}
            className={`${styles.thumbnailWrapper} ${selectedImage?.id === image.id ? styles.thumbnailWrapperActive : ''}`}
            onClick={() => handleClick(image)}
          >
            <img
              src={image.url}
              alt={image.alt}
              className={styles.thumbnail}
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {selectedImage && (
        <div className={styles.selectedContainer}>
          <div className={styles.selectedHeader}>
            <h2 className={styles.selectedTitle}>{selectedImage.alt}</h2>
            <button
              className={styles.clearButton}
              onClick={() => setSelectedImage(null)}
            >
              ×
            </button>
          </div>
          <img
            src={selectedImage.url}
            alt={selectedImage.alt}
            className={styles.selectedImage}
          />
        </div>
      )}

      {!selectedImage && (
        <div className={styles.placeholder}>
          <p>Select an image to see it here.</p>
        </div>
      )}
    </div>
  );
}