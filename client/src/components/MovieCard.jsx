import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Plus, Check, ThumbsUp, ChevronDown, Star } from 'lucide-react';

export default function MovieCard({ movie, onPlay, onOpenModal, isInWatchlist, onToggleWatchlist, isSubscribed }) {
  const [hovered, setHovered] = useState(false);
  const enterTimer = useRef(null);
  const cardRef = useRef(null);

  const cachedUser = localStorage.getItem('netflix_user');
  const user = cachedUser ? JSON.parse(cachedUser) : null;
  const userIsSubscribed = isSubscribed !== undefined ? isSubscribed : (user?.subscriptionStatus === 'ACTIVE' || user?.role === 'ADMIN');

  const matchPct = useRef(Math.floor(Math.random() * 15) + 85);
  const firstGenre = movie.genres ? movie.genres.split(',')[0].trim() : '';
  const releaseYear = movie.releaseYear || movie.year || '';

  const onEnter = useCallback(() => {
    if (window.innerWidth <= 768) return;
    enterTimer.current = setTimeout(() => setHovered(true), 400);
  }, []);

  const onLeave = useCallback(() => {
    clearTimeout(enterTimer.current);
    setHovered(false);
  }, []);

  useEffect(() => () => clearTimeout(enterTimer.current), []);

  const handlePlay = (e) => { e.stopPropagation(); onPlay(movie); };
  const handleWatchlist = (e) => { e.stopPropagation(); onToggleWatchlist(movie); };
  const handleModal = (e) => { e.stopPropagation(); onOpenModal(movie); };

  return (
    <div
      ref={cardRef}
      className={`nf-card${hovered ? ' nf-card--hovered' : ''}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={() => { if (window.innerWidth <= 768) onOpenModal(movie); }}
    >
      {/* Base poster — always visible */}
      <div className="nf-card-poster">
        <img
          src={movie.thumbnailUrl}
          alt={movie.title}
          className="nf-card-img"
          loading="lazy"
          onError={e => { e.target.style.display = 'none'; e.target.parentElement.classList.add('nf-card-poster--broken'); }}
        />
        {/* Broken poster fallback */}
        <div className="nf-card-broken-label">{movie.title}</div>

        {!userIsSubscribed && <div className="nf-card-premium"><Star size={9} fill="#ffc107" color="#ffc107" /> Premium</div>}
        {movie.vj && <div className="nf-card-vj">{movie.vj}</div>}
      </div>

      {/* Title below poster (always shown) */}
      <div className="nf-card-below">
        <div className="nf-card-title">{movie.title}</div>
        <div className="nf-card-sub">{firstGenre}{firstGenre && releaseYear ? ' • ' : ''}{releaseYear}</div>
      </div>

      {/* Hover popup — Netflix style */}
      {hovered && (
        <div className="nf-hover-card" onClick={e => e.stopPropagation()}>
          {/* Landscape preview image (backdrop or poster) */}
          <div className="nf-hover-thumb" onClick={handlePlay}>
            <img
              src={movie.backdropUrl || movie.thumbnailUrl}
              alt={movie.title}
              className="nf-hover-thumb-img"
            />
            <div className="nf-hover-thumb-overlay" />
            <div className="nf-hover-thumb-title">{movie.title}</div>
          </div>

          {/* Controls */}
          <div className="nf-hover-body">
            <div className="nf-hover-controls">
              <div className="nf-hover-controls-left">
                <button className="nf-ctrl-btn nf-ctrl-btn--play" onClick={handlePlay} title="Play">
                  {userIsSubscribed
                    ? <Play size={18} fill="#000" color="#000" />
                    : <span style={{ fontSize: '0.75rem', fontWeight: 900 }}>🔒</span>}
                </button>
                <button className="nf-ctrl-btn" onClick={handleWatchlist} title={isInWatchlist ? 'Remove' : 'Add to list'}>
                  {isInWatchlist ? <Check size={16} color="#fff" /> : <Plus size={16} color="#fff" />}
                </button>
                <button className="nf-ctrl-btn" onClick={e => { e.stopPropagation(); }} title="Like">
                  <ThumbsUp size={16} color="#fff" />
                </button>
              </div>
              <button className="nf-ctrl-btn" onClick={handleModal} title="More info">
                <ChevronDown size={18} color="#fff" />
              </button>
            </div>

            {/* Meta row */}
            <div className="nf-hover-meta">
              <span className="nf-hover-match">{matchPct.current}% Match</span>
              {movie.rating && <span className="nf-hover-rating">{movie.rating}</span>}
              {movie.duration && <span className="nf-hover-duration">{movie.duration}</span>}
            </div>

            {/* Genres */}
            {movie.genres && (
              <div className="nf-hover-genres">
                {movie.genres.split(',').slice(0, 3).map((g, i) => (
                  <span key={i} className="nf-hover-genre-item">
                    {i > 0 && <span className="nf-hover-dot">•</span>}
                    {g.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
