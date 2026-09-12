import React, { useState, useEffect, useRef } from 'react';
import { Play, Info, Volume2, VolumeX } from 'lucide-react';

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
            // Native player doesn't stream HLS easily without hls.js, 
            // so we fallback to backdrop if it's HLS, or stream it if hls.js is loaded.
            // For the hero banner, standard MP4 previews are easiest, 
            // but we can initialize hls.js for HLS as well.
            // Let's implement HLS banner autoplay in a simplified way or fallback to poster.
            // To ensure 100% video play, if HLS, we will try to use native player (Safari) 
            // or simply play it since hls.js is installed. 
            // For now, let's load a standard video element with hls.js:
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
          <span className="brand-gradient-text" style={{ fontSize: '1.1rem', fontWeight: '900', letterSpacing: '2px' }}>
            MOVIEZONE EXCLUSIVE
          </span>
          <span style={{ fontSize: '0.8rem', color: '#e5e5e5', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase' }}>
            • {movie.type === 'SHOW' ? 'Series' : 'Film'}
          </span>
        </div>
        <h1 className="billboard-title">{movie.title}</h1>
        <p className="billboard-desc">{movie.description}</p>
        <div className="billboard-actions">
          <button className="billboard-btn billboard-play" onClick={() => onPlay(movie)}>
            <Play size={20} fill="#000" /> Play
          </button>
          <button className="billboard-btn billboard-info-btn" onClick={() => onOpenModal(movie)}>
            <Info size={20} /> More Info
          </button>
        </div>
      </div>

      <div className="billboard-right-controls">
        <button
          className="billboard-control-btn"
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? <VolumeX size={20} color="#fff" /> : <Volume2 size={20} color="#fff" />}
        </button>
        <span className="billboard-rating-label">
          {movie.rating}
        </span>
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
