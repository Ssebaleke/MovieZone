import React, { useState, useEffect, useRef } from 'react';
import { Play, Info, Volume2, VolumeX, Plus } from 'lucide-react';

export default function HeroBanner({ movie, onPlay, onOpenModal }) {
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    setIsPlayingVideo(false);
    
    if (!movie) return;

    // Set auto-play delay for featured banner (2 seconds)
    const timer = setTimeout(() => {
      setIsPlayingVideo(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [movie]);

  if (!movie) return <div style={{ height: '80vh', background: '#000' }} />;

  const isHls = movie.videoUrl.endsWith('.m3u8');

  return (
    <div
      className="billboard-hero"
      style={{ backgroundImage: !isPlayingVideo ? `url(${movie.backdropUrl})` : 'none' }}
    >
      {/* Video Preview */}
      {isPlayingVideo && (
        <div className="billboard-video-container">
          {isHls ? (
            <HlsPlayer
              src={movie.videoUrl}
              videoRef={videoRef}
              isMuted={isMuted}
              poster={movie.backdropUrl}
            />
          ) : (
            <video
              ref={videoRef}
              src={movie.videoUrl}
              autoPlay
              muted={isMuted}
              loop
              playsInline
            />
          )}
        </div>
      )}

      <div className="billboard-overlay"></div>

      <div className="billboard-info">
        <h1 className="billboard-title-desktop">{movie.title}</h1>

        {/* Metadata Row: 2026 | SERIES | 1 Season | VJ Ice p */}
        <div className="billboard-meta-badges-row">
          <span className="meta-year-green">{movie.releaseYear || movie.year || 2026}</span>
          <span className="meta-type-badge">{movie.type === 'SHOW' ? 'SERIES' : 'MOVIE'}</span>
          <span className="meta-season-text">{movie.type === 'SHOW' ? '1 Season' : (movie.duration || '2h 15m')}</span>
          {movie.vj && (
            <span className="meta-vj-badge">{movie.vj}</span>
          )}
        </div>

        {/* Genre Pills Row */}
        <div className="billboard-genre-pills-row">
          {movie.genres ? (
            movie.genres.split(',').map((g, idx) => (
              <span key={idx} className="genre-pill-item">{g.trim()}</span>
            ))
          ) : (
            <>
              <span className="genre-pill-item">Action & Adventure</span>
              <span className="genre-pill-item">Crime</span>
              <span className="genre-pill-item">Drama</span>
            </>
          )}
        </div>

        <p className="billboard-desc">{movie.description}</p>

        {/* 3 Action Buttons Row: Play, More Info, My List */}
        <div className="billboard-actions-row">
          <button className="billboard-btn billboard-play-solid" onClick={() => onPlay(movie)}>
            <Play size={18} fill="#000" color="#000" /> Play
          </button>
          <button className="billboard-btn billboard-translucent-btn" onClick={() => onOpenModal(movie)}>
            <Info size={18} color="#fff" /> More Info
          </button>
          <button className="billboard-btn billboard-translucent-btn" onClick={() => onOpenModal(movie)}>
            <Plus size={18} color="#fff" /> My List
          </button>
        </div>
      </div>

      <div className="billboard-right-controls">
        <button
          className="billboard-control-btn"
          onClick={() => setIsMuted(!isMuted)}
          aria-label="Toggle mute"
        >
          {isMuted ? <VolumeX size={18} color="#fff" /> : <Volume2 size={18} color="#fff" />}
        </button>

        {/* Carousel indicators matching desktop screenshot */}
        <div className="carousel-indicators">
          <span className="indicator-line active"></span>
          <span className="indicator-dot"></span>
          <span className="indicator-dot"></span>
          <span className="indicator-dot"></span>
        </div>
      </div>
    </div>
  );
}

// Inner helper component to initialize HLS streaming in background banner
function HlsPlayer({ src, videoRef, isMuted, poster }) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls = null;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Apple HLS support
      video.src = src;
    } else {
      // Use hls.js
      import('hls.js').then((Hls) => {
        if (Hls.isSupported()) {
          hls = new Hls.default();
          hls.loadSource(src);
          hls.attachMedia(video);
        }
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src, videoRef]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted={isMuted}
      loop
      playsInline
      poster={poster}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
}
