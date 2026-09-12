import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize2, Minimize2, ArrowLeft } from 'lucide-react';
import { api } from '../utils/api';

export default function VideoPlayer({ movie, onClose }) {
  // Common states
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);
  const currentProfile = JSON.parse(localStorage.getItem('netflix_profile') || '{}');

  // Iframe Embed States (for vidsrc.sbs)
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

  // Local/Custom Video Player States (Fallback)
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoRef = useRef(null);
  const playerRef = useRef(null);

  // Parse total seasons from duration string
  const getSeasonsCount = () => {
    if (!movie.duration) return 1;
    const match = movie.duration.match(/(\d+)\s*Season/i);
    if (match) {
      return parseInt(match[1], 10);
    }
    // Fallback based on typical count
    return 6;
  };

  const getEpisodesCount = () => {
    return 24; // Allow selecting up to 24 episodes per season
  };

  // Helper to save watch progress to server
  const saveProgress = async (seconds) => {
    try {
      await api.post('/history/progress', {
        profileId: currentProfile.id,
        movieId: movie.id,
        progressSeconds: seconds
      });
    } catch (err) {
      console.error('Error saving progress bookmark:', err);
    }
  };

  // Register watch history on mount or when season/episode changes
  useEffect(() => {
    if (movie.tmdbId && currentProfile.id) {
      saveProgress(1); // Set progress to 1 to register in "Continue Watching"
    }
  }, [movie.id, season, episode]);

  // Handle controls auto-hide on mouse idle
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3500); // Hide controls after 3.5 seconds of inactivity
  };

  useEffect(() => {
    handleMouseMove();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Direct ReelPlexi stream fetch
  const [directStreamUrl, setDirectStreamUrl] = useState(movie.videoUrl || '');
  const [directEmbedUrl, setDirectEmbedUrl] = useState(movie.embedUrl || '');

  useEffect(() => {
    let isMounted = true;
    const fetchStreamData = async () => {
      try {
        const res = await api.get(`/movies/${movie.id}`);
        if (res && res.movie && isMounted) {
          if (res.movie.videoUrl) setDirectStreamUrl(res.movie.videoUrl);
          if (res.movie.embedUrl) setDirectEmbedUrl(res.movie.embedUrl);
        }
      } catch (e) {
        console.error('Error fetching direct ReelPlexi stream:', e);
      }
    };

    fetchStreamData();
    return () => { isMounted = false; };
  }, [movie.id]);

  const activeVideoUrl = directStreamUrl || movie.videoUrl || '';
  const isReelplexiStream = Boolean(activeVideoUrl && (
    activeVideoUrl.includes('reelplexi.com') ||
    activeVideoUrl.includes('mlegacytv.com') ||
    activeVideoUrl.includes('stream/proxy') ||
    activeVideoUrl.endsWith('.mp4') ||
    activeVideoUrl.endsWith('.mkv') ||
    activeVideoUrl.endsWith('.m3u8')
  ));

  // ----------------------------------------------------
  // Local Player Effects & Handlers
  // ----------------------------------------------------
  useEffect(() => {
    if (!isReelplexiStream && movie.tmdbId) return; // Skip custom video setup if falling back to external iframe

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
          console.log(`Resuming custom playback at ${savedRecord.progressSeconds}s`);
          video.currentTime = savedRecord.progressSeconds;
        }
      } catch (err) {
        console.error('Error restoring progress bookmark:', err);
      }
    };

    video.addEventListener('loadedmetadata', () => {
      setDuration(video.duration);
      restoreBookmark();
    });

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [activeVideoUrl, isReelplexiStream, movie.id, movie.tmdbId]);

  // Periodic watch progress check-in (every 5.5 seconds)
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

  // Server Selection States for fallback
  const [activeServer, setActiveServer] = useState('pro-multi');

  const SERVERS = [
    { id: 'pro-multi', name: 'Server 1 (Pro Multi)' },
    { id: 'vidsrc-me', name: 'Server 2 (VidSrc Fast)' },
    { id: 'embed-su', name: 'Server 3 (Ultra HD)' },
    { id: '2embed', name: 'Server 4 (Multi-Lang)' }
  ];

  const getEmbedUrl = () => {
    const isShow = movie.type === 'SHOW';
    if (activeServer === 'vidsrc-me') {
      return isShow
        ? `https://vidsrc.me/embed/tv?tmdb=${movie.tmdbId}&season=${season}&episode=${episode}`
        : `https://vidsrc.me/embed/movie?tmdb=${movie.tmdbId}`;
    }
    if (activeServer === 'embed-su') {
      return isShow
        ? `https://embed.su/embed/tv/${movie.tmdbId}/${season}/${episode}`
        : `https://embed.su/embed/movie/${movie.tmdbId}`;
    }
    if (activeServer === '2embed') {
      return isShow
        ? `https://www.2embed.cc/embedtv/${movie.tmdbId}&s=${season}&e=${episode}`
        : `https://www.2embed.cc/embed/${movie.tmdbId}`;
    }
    return isShow
      ? `https://vidsrc.sbs/embed/tv/${movie.tmdbId}/${season}/${episode}`
      : `https://vidsrc.sbs/embed/movie/${movie.tmdbId}`;
  };

  // ----------------------------------------------------
  // Render Method
  // ----------------------------------------------------
  if (!isReelplexiStream && movie.tmdbId) {
    // Return Fallback Iframe Player ONLY if ReelPlexi direct stream is unavailable
    return (
      <div
        ref={playerRef}
        className="custom-player-wrapper"
        onMouseMove={handleMouseMove}
        style={{ background: '#000' }}
      >
        <iframe
          key={`${activeServer}-${season}-${episode}`}
          src={getEmbedUrl()}
          className="custom-player-video"
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          style={{ width: '100vw', height: '100vh', border: 'none', zIndex: '1' }}
          title={movie.title}
        />

        {/* Float Controls Overlay */}
        <div
          className={`player-controls-overlay ${showControls ? 'active' : ''}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100px',
            background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.4) 60%, transparent 100%)',
            display: 'flex',
            alignItems: 'center',
            padding: '20px 40px',
            zIndex: '10',
            opacity: showControls ? 1 : 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: showControls ? 'auto' : 'none'
          }}
        >
          <button className="player-back-btn" onClick={onClose} style={{ zIndex: '20' }}>
            <ArrowLeft size={30} color="#fff" />
          </button>
          <div className="player-title" style={{ color: '#fff', fontSize: '1.4rem', fontWeight: '700', marginLeft: '15px' }}>
            {movie.title} {movie.vj && <span style={{ background: '#e50914', color: '#fff', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', marginLeft: '10px', verticalAlign: 'middle' }}>{movie.vj}</span>}
          </div>

          {/* Streaming Server Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '30px', zIndex: '20' }}>
            <span style={{ fontSize: '0.85rem', color: '#e50914', fontWeight: 'bold' }}>SERVER:</span>
            <select
              value={activeServer}
              onChange={(e) => setActiveServer(e.target.value)}
              style={{
                background: '#181818',
                border: '1px solid #e50914',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '700',
                outline: 'none'
              }}
            >
              {SERVERS.map((srv) => (
                <option key={srv.id} value={srv.id}>{srv.name}</option>
              ))}
            </select>
          </div>

          {movie.type === 'SHOW' && (
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginLeft: '25px', zIndex: '20' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: '#bbb', fontWeight: 'bold' }}>SEASON</span>
                <select
                  value={season}
                  onChange={(e) => {
                    setSeason(parseInt(e.target.value, 10));
                    setEpisode(1);
                  }}
                  style={{
                    background: '#141414',
                    border: '1px solid #444',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    outline: 'none'
                  }}
                >
                  {Array.from({ length: getSeasonsCount() }, (_, i) => i + 1).map((s) => (
                    <option key={s} value={s}>Season {s}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: '#bbb', fontWeight: 'bold' }}>EPISODE</span>
                <select
                  value={episode}
                  onChange={(e) => setEpisode(parseInt(e.target.value, 10))}
                  style={{
                    background: '#141414',
                    border: '1px solid #444',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    outline: 'none'
                  }}
                >
                  {Array.from({ length: getEpisodesCount() }, (_, i) => i + 1).map((ep) => (
                    <option key={ep} value={ep}>Episode {ep}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback to Native HTML5/HLS Player for custom uploaded videos
  return (
    <div
      ref={playerRef}
      className="custom-player-wrapper"
      onMouseMove={handleMouseMove}
    >
      <video
        ref={videoRef}
        className="custom-player-video"
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        autoPlay
        playsInline
      />

      <div className={`player-controls-overlay ${showControls ? 'active' : ''}`}>
        
        {/* Top Row: Back button & Title */}
        <div className="player-top-row">
          <button className="player-back-btn" onClick={onClose}>
            <ArrowLeft size={30} color="#fff" />
          </button>
          <div className="player-title">{movie.title}</div>
        </div>

        {/* Bottom Row: Slider timeline & Buttons */}
        <div className="player-bottom-controls">
          
          {/* Timeline slider seek bar */}
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

          {/* Control Buttons Row */}
          <div className="player-buttons-row">
            <div className="player-buttons-left">
              
              {/* Play / Pause */}
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

              {/* Volume Controls */}
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
              
              {/* Speed Multiplier dropdown */}
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
