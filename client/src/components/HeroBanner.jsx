import React, { useState, useEffect, useRef } from 'react';
import { Play, Info, Volume2, VolumeX, Plus } from 'lucide-react';

export default function HeroBanner({ movie, onPlay, onOpenModal, isSubscribed }) {
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    setIsPlayingVideo(false);
    
    if (!movie) return;

    // Set auto-play delay for featured banner (2 seconds)
    const timer = setTimeout(() => {
      setIsPlayingVideo(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, [movie]);

  if (!movie) return <div style={{ height: '80vh', background: '#000' }} />;

  const isHls = movie.videoUrl.endsWith('.m3u8');

  return (
    <>
      {/* Desktop / Landscape Hero Banner */}
      <div
        className="billboard-hero billboard-hero-desktop"
        style={{ backgroundImage: `url(${movie.backdropUrl})` }}
      >
        {isPlayingVideo && (
          <div className="billboard-video-container">
            {isHls ? (
              <HlsPlayer src={movie.videoUrl} videoRef={videoRef} isMuted={isMuted} poster={movie.backdropUrl} />
            ) : (
              <video ref={videoRef} src={movie.videoUrl} autoPlay muted={isMuted} loop playsInline poster={movie.backdropUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>
        )}

        <div className="billboard-overlay"></div>

        <div className="billboard-info">
          <h1 className="billboard-title-desktop">{movie.title}</h1>
          <div className="billboard-meta-badges-row">
            <span className="meta-year-green">{movie.releaseYear || movie.year || 2026}</span>
            <span className="meta-type-badge">{movie.type === 'SHOW' ? 'SERIES' : 'MOVIE'}</span>
            <span className="meta-season-text">{movie.type === 'SHOW' ? '1 Season' : (movie.duration || '2h 15m')}</span>
            {movie.vj && <span className="meta-vj-badge">{movie.vj}</span>}
          </div>
          <div className="billboard-genre-pills-row">
            {movie.genres ? movie.genres.split(',').map((g, idx) => (
              <span key={idx} className="genre-pill-item">{g.trim()}</span>
            )) : (
              <><span className="genre-pill-item">Action & Adventure</span><span className="genre-pill-item">Drama</span></>
            )}
          </div>
          <p className="billboard-desc">{movie.description}</p>
          <div className="billboard-actions-row">
            <button className="billboard-btn billboard-play-solid" onClick={() => onPlay(movie)}>
              {isSubscribed ? <><Play size={18} fill="#000" color="#000" /> Play</> : <>🔒 Subscribe to Watch</>}
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
          <button className="billboard-control-btn" onClick={() => setIsMuted(!isMuted)} aria-label="Toggle mute">
            {isMuted ? <VolumeX size={18} color="#fff" /> : <Volume2 size={18} color="#fff" />}
          </button>
          <div className="carousel-indicators" style={{ display: 'flex' }}>
            <span className="indicator-line active"></span>
            <span className="indicator-dot"></span>
            <span className="indicator-dot"></span>
            <span className="indicator-dot"></span>
          </div>
        </div>
      </div>

      {/* Mobile Hero Banner — full bleed backdrop/video with overlay */}
      <div className="billboard-hero-mobile">
        {/* Background: video if playing, else backdrop image */}
        <div className="mobile-banner-video-bg" style={{ backgroundImage: `url(${movie.backdropUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        {isPlayingVideo && (
          <div className="mobile-banner-video-bg" style={{ position: 'absolute', inset: 0 }}>
            {isHls ? (
              <HlsPlayer src={movie.videoUrl} videoRef={videoRef} isMuted={isMuted} poster={movie.backdropUrl} />
            ) : (
              <video ref={videoRef} src={movie.videoUrl} autoPlay muted={isMuted} loop playsInline poster={movie.backdropUrl}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>
        )}

        {/* Dark gradient overlay */}
        <div className="mobile-banner-overlay" />

        {/* Mute toggle top-right */}
        <button className="mobile-banner-mute-btn" onClick={() => setIsMuted(!isMuted)} aria-label="Toggle mute">
          {isMuted ? <VolumeX size={16} color="#fff" /> : <Volume2 size={16} color="#fff" />}
        </button>

        {/* Content at bottom */}
        <div className="mobile-banner-content">
          {/* Small portrait thumbnail + title side by side */}
          <div className="mobile-banner-title-row">
            <img src={movie.thumbnailUrl} alt={movie.title} className="mobile-banner-thumb" />
            <div className="mobile-banner-text">
              <h1 className="mobile-banner-title">{movie.title}</h1>
              <div className="billboard-meta-badges-row" style={{ marginBottom: '0' }}>
                <span className="meta-year-green">{movie.releaseYear || movie.year || 2026}</span>
                <span className="meta-type-badge">{movie.type === 'SHOW' ? 'SERIES' : 'MOVIE'}</span>
                {movie.vj && <span className="meta-vj-badge">{movie.vj}</span>}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mobile-banner-actions">
            <button className="mobile-banner-btn mobile-banner-btn-play" onClick={() => onPlay(movie)}>
              {isSubscribed ? <><Play size={15} fill="#000" color="#000" /> Play</> : <>🔒 Subscribe</>}
            </button>
            <button className="mobile-banner-btn mobile-banner-btn-info" onClick={() => onOpenModal(movie)}>
              <Info size={15} color="#fff" /> More Info
            </button>
          </div>
        </div>
      </div>
    </>
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
