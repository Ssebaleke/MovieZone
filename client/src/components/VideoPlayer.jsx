import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize2, Minimize2, ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../utils/api';

export default function VideoPlayer({ movie, onClose }) {
  const [currentMovie, setCurrentMovie] = useState(movie);
  const [loadingStream, setLoadingStream] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);
  const currentProfile = JSON.parse(localStorage.getItem('netflix_profile') || '{}');

  // Video player controls state
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [useEmbedFallback, setUseEmbedFallback] = useState(false);

  const videoRef = useRef(null);
  const playerRef = useRef(null);

  // Fetch direct video stream URL for the exact movie selected
  useEffect(() => {
    setCurrentMovie(movie);
    if (!movie?.id) {
      setLoadingStream(false);
      return;
    }

    let isMounted = true;
    setLoadingStream(true);

    api.get(`/movies/${movie.id}`)
      .then(data => {
        if (isMounted && data && data.movie) {
          setCurrentMovie(prev => ({
            ...prev,
            ...data.movie
          }));
        }
      })
      .catch(err => {
        console.error('Error fetching stream for movie:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingStream(false);
      });

    return () => { isMounted = false; };
  }, [movie.id]);

  // Helper to save watch progress bookmark to database
  const saveProgress = async (seconds) => {
    const targetMovie = currentMovie || movie;
    if (!currentProfile.id || !targetMovie.id) return;
    try {
      await api.post('/history/progress', {
        profileId: currentProfile.id,
        movieId: targetMovie.id,
        progressSeconds: Math.floor(seconds),
        movieDetails: {
          title: targetMovie.title,
          description: targetMovie.description,
          thumbnailUrl: targetMovie.thumbnailUrl,
          backdropUrl: targetMovie.backdropUrl,
          videoUrl: targetMovie.videoUrl,
          duration: targetMovie.duration,
          releaseYear: targetMovie.releaseYear,
          rating: targetMovie.rating,
          genres: targetMovie.genres,
          type: targetMovie.type,
          vj: targetMovie.vj,
          region: targetMovie.region
        }
      });
    } catch (err) {
      console.error('Error saving progress bookmark:', err);
    }
  };

  // Register initial watch progress
  useEffect(() => {
    if (currentMovie.id && currentProfile.id) {
      saveProgress(1);
    }
  }, [currentMovie.id]);

  // Controls auto-hide timer
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3500);
  };

  const activeVideoUrl = currentMovie.videoUrl || movie.videoUrl || '';
  const activeEmbedUrl = currentMovie.embedUrl || movie.embedUrl || '';

  const handleVideoError = (e) => {
    console.warn("Native video tag playback error, switching to ReelPlexi official player:", e);
    if (activeEmbedUrl) {
      setUseEmbedFallback(true);
    }
  };

  // Setup video source & restore progress bookmark
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeVideoUrl) return;

    let hls = null;
    const isHls = activeVideoUrl.endsWith('.m3u8');

    if (isHls) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = activeVideoUrl;
      } else {
        import('hls.js').then((Hls) => {
          if (Hls.isSupported()) {
            hls = new Hls.default();
            hls.loadSource(activeVideoUrl);
            hls.attachMedia(video);
          }
        });
      }
    } else {
      video.src = activeVideoUrl;
    }

    const restoreBookmark = async () => {
      try {
        const history = await api.get(`/history/${currentProfile.id}`);
        const savedRecord = history.find(item => item.movie.id === movie.id);
        if (savedRecord && savedRecord.progressSeconds > 0) {
          video.currentTime = savedRecord.progressSeconds;
        }
      } catch (err) {
        console.error('Error restoring progress bookmark:', err);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      restoreBookmark();
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      if (hls) {
        hls.destroy();
      }
    };
  }, [activeVideoUrl, movie.id]);

  // Periodic watch progress check-in
  useEffect(() => {
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video && isPlaying && currentProfile.id) {
        saveProgress(Math.floor(video.currentTime));
      }
    }, 5500);

    return () => {
      clearInterval(interval);
      if (videoRef.current && currentProfile.id) {
        saveProgress(Math.floor(videoRef.current.currentTime));
      }
    };
  }, [isPlaying, movie.id]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().catch(err => console.error(err));
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const seekTime = parseFloat(e.target.value);
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const skipSeconds = (amount) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(0, video.currentTime + amount), duration);
  };

  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const vol = parseFloat(e.target.value);
    video.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const handleSpeedChange = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const speed = parseFloat(e.target.value);
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const toggleFullscreen = () => {
    const player = playerRef.current;
    if (!player) return;

    if (!document.fullscreenElement) {
      player.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => console.error(err));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const paddedSeconds = seconds < 10 ? `0${seconds}` : seconds;

    if (hours > 0) {
      const paddedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      return `${hours}:${paddedMinutes}:${paddedSeconds}`;
    }
    return `${minutes}:${paddedSeconds}`;
  };

  const targetMovie = currentMovie || movie;

  return (
    <div
      ref={playerRef}
      className="custom-player-wrapper"
      onMouseMove={handleMouseMove}
      style={{ background: '#000' }}
    >
      {/* Loading Indicator */}
      {loadingStream && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.85)',
          zIndex: 10,
          color: '#fff',
          gap: '12px'
        }}>
          <Loader2 className="animate-spin" size={48} color="#E50914" />
          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            Loading {targetMovie.title}...
          </div>
          {targetMovie.vj && (
            <div style={{ fontSize: '0.85rem', color: '#aaa' }}>
              Voiced by {targetMovie.vj}
            </div>
          )}
        </div>
      )}

      {/* Native Video Element or ReelPlexi Official Embed Player */}
      {useEmbedFallback && activeEmbedUrl ? (
        <iframe
          src={activeEmbedUrl}
          title={targetMovie.title}
          style={{ width: '100%', height: '100%', border: 'none', background: '#000' }}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video
          ref={videoRef}
          className="custom-player-video"
          onTimeUpdate={handleTimeUpdate}
          onError={handleVideoError}
          onClick={togglePlay}
          autoPlay
          playsInline
        />
      )}

      {/* Custom Video Player Controls Overlay */}
      <div className={`player-controls-overlay ${showControls ? 'active' : ''}`}>
        
        {/* Top Header Row: Back button & Title */}
        <div className="player-top-row">
          <button className="player-back-btn" onClick={onClose} title="Back">
            <ArrowLeft size={30} color="#fff" />
          </button>
          <div className="player-title">
            {targetMovie.title}
            {targetMovie.vj && <span style={{ marginLeft: '10px', fontSize: '0.85rem', background: '#E50914', color: '#fff', padding: '2px 8px', borderRadius: '4px' }}>{targetMovie.vj}</span>}
          </div>
        </div>

        {/* Bottom Controls Area */}
        <div className="player-bottom-controls">
          
          {/* Timeline Seek Bar */}
          <div className="player-timeline-container">
            <span className="player-time-display">{formatTime(currentTime)}</span>
            <input
              type="range"
              className="player-slider"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
            />
            <span className="player-time-display">{formatTime(duration - currentTime)}</span>
          </div>

          {/* Controls Button Bar */}
          <div className="player-buttons-row">
            <div className="player-buttons-left">
              
              {/* Play / Pause Toggle */}
              <button className="player-control-icon-btn" onClick={togglePlay}>
                {isPlaying ? <Pause size={28} fill="#fff" /> : <Play size={28} fill="#fff" />}
              </button>

              {/* Rewind / Fast Forward */}
              <button className="player-control-icon-btn" onClick={() => skipSeconds(-10)}>
                <RotateCcw size={24} />
                <span style={{ fontSize: '0.65rem', position: 'absolute', fontWeight: 'bold' }}>10</span>
              </button>
              <button className="player-control-icon-btn" onClick={() => skipSeconds(10)}>
                <RotateCw size={24} />
                <span style={{ fontSize: '0.65rem', position: 'absolute', fontWeight: 'bold' }}>10</span>
              </button>

              {/* Volume & Mute */}
              <div className="volume-slider-group">
                <button className="player-control-icon-btn" onClick={toggleMute}>
                  {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>
                <input
                  type="range"
                  className="volume-bar"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                />
              </div>

            </div>

            <div className="player-buttons-right">
              
              {/* Playback Speed Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: '#888' }}>Speed</span>
                <select
                  className="player-speed-selector"
                  value={playbackSpeed}
                  onChange={handleSpeedChange}
                >
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1.0x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2.0x</option>
                </select>
              </div>

              {/* Fullscreen Button */}
              <button className="player-control-icon-btn" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
              </button>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
