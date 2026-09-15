import React from 'react';

export function SkeletonHero() {
  return (
    <div className="skeleton-hero">
      <div className="skeleton-hero-content">
        <div className="skeleton-block" style={{ width: '60%', height: '2.8rem', borderRadius: 8, marginBottom: 14 }} />
        <div className="skeleton-block" style={{ width: '40%', height: '1rem', borderRadius: 6, marginBottom: 8 }} />
        <div className="skeleton-block" style={{ width: '30%', height: '1rem', borderRadius: 6, marginBottom: 24 }} />
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="skeleton-block" style={{ width: 120, height: 44, borderRadius: 6 }} />
          <div className="skeleton-block" style={{ width: 120, height: 44, borderRadius: 6 }} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonRow({ count = 6 }) {
  return (
    <div className="movie-row-container">
      <div className="movie-row-header-line">
        <div className="skeleton-block" style={{ width: 160, height: '1.2rem', borderRadius: 6 }} />
      </div>
      <div className="movie-cards-track" style={{ padding: '10px 12px 16px', gap: 10 }}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="skeleton-block"
            style={{
              flex: '0 0 calc(16.666% - 7px)',
              minWidth: 120,
              aspectRatio: '2/3',
              borderRadius: 8,
            }}
          />
        ))}
      </div>
    </div>
  );
}
