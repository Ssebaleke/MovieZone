import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import MovieCard from './MovieCard';

export default function MovieRow({ title, movies, onPlay, onOpenModal, watchlist, onToggleWatchlist, isSubscribed }) {
  const trackRef = useRef(null);
  const [showAll, setShowAll] = useState(false);

  const handleScroll = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    const scrollAmount = track.clientWidth * 0.75;
    if (direction === 'left') track.scrollLeft -= scrollAmount;
    else track.scrollLeft += scrollAmount;
  };

  const isMovieInWatchlist = (movieId) => watchlist && watchlist.some(m => m.id === movieId);
  const isTop10 = title === "Top 10 Today";

  if (!movies || movies.length === 0) return null;

  return (
    <>
    <div className="movie-row-container" style={{ overflow: 'visible' }}>
      <div className="movie-row-header-line">
        <h2 className="movie-row-title">{title}</h2>
        <span className="row-view-all-link" onClick={() => setShowAll(true)}>View all &rsaquo;</span>
      </div>
      
      <div className="slider-wrapper" style={{ overflow: 'visible' }}>
        <button className="slider-arrow left" onClick={() => handleScroll('left')}>
          <ChevronLeft size={24} />
        </button>
        
        <div className={isTop10 ? "top10-cards-track" : "movie-cards-track"} ref={trackRef} style={{ overflowY: 'visible' }}>
          {movies.map((movie, idx) => (
            isTop10 ? (
              <div className="top10-item-container" key={movie.id}>
                <div className="top10-rank-number">{idx + 1}</div>
                <div className="top10-card-wrapper">
                  <MovieCard movie={movie} onPlay={onPlay} onOpenModal={onOpenModal}
                    isInWatchlist={isMovieInWatchlist(movie.id)} onToggleWatchlist={onToggleWatchlist} isSubscribed={isSubscribed} />
                </div>
              </div>
            ) : (
              <MovieCard key={movie.id} movie={movie} onPlay={onPlay} onOpenModal={onOpenModal}
                isInWatchlist={isMovieInWatchlist(movie.id)} onToggleWatchlist={onToggleWatchlist} isSubscribed={isSubscribed} />
            )
          ))}
        </div>
        
        <button className="slider-arrow right" onClick={() => handleScroll('right')}>
          <ChevronRight size={24} />
        </button>
      </div>
    </div>

    {/* Full grid overlay */}
    {showAll && (
      <div className="view-all-overlay" onClick={() => setShowAll(false)}>
        <div className="view-all-panel" onClick={e => e.stopPropagation()}>
          <div className="view-all-header">
            <h2>{title}</h2>
            <button className="view-all-close" onClick={() => setShowAll(false)}><X size={22} /></button>
          </div>
          <div className="view-all-grid">
            {movies.map(movie => (
              <MovieCard key={movie.id} movie={movie} onPlay={(m) => { setShowAll(false); onPlay(m); }}
                onOpenModal={(m) => { setShowAll(false); onOpenModal(m); }}
                isInWatchlist={isMovieInWatchlist(movie.id)} onToggleWatchlist={onToggleWatchlist} isSubscribed={isSubscribed} />
            ))}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
