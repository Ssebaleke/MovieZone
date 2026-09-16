import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize2, Minimize2, ArrowLeft, Loader2, ChevronDown, ChevronUp, List } from 'lucide-react';
import { api } from '../utils/api';

export default function VideoPlayer({ movie, onClose }) {
  const [currentMovie, setCurrentMovie] = useState(movie);
  const [loadingStream, setLoadingStream] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [useEmbedFallback, setUseEmbedFallback] = useState(false);
  const [isMobile] = useState(() => window.innerWidth <= 768);

  // Series episodes panel
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [seasons, setSeasons] = useState([]);
  const [activeSeason, setActiveSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const controlsTimer = useRef(null);
  const currentProfile = JSON.parse(localStorage.getItem('netflix_profile') || '{}');

  const isSeries = currentMovie?.type === 'SHOW' || movie?.type === 'SHOW';

  // Auto-open episodes panel if triggered from detail modal
  useEffect(() => {
    if (movie?.openEpisodes && isSeries) setShowEpisodes(true);
  }, [movie?.openEpisodes, isSeries]);

  // Fetch stream details
  useEffect(() => {
    setCurrentMovie(movie);
    if (!movie?.id) { setLoadingStream(false); return; }
    let mounted = true;
    setLoadingStream(true);
    api.get(`/movies/${movie.id}`)
      .then(data => { if (mounted && data?.movie) setCurrentMovie(p => ({ ...p, ...data.movie })); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoadingStream(false); });
    return () => { mounted = false; };
  }, [movie.id]);

  // Fetch seasons/episodes for series
  useEffect(() => {
    if (!isSeries || !currentMovie?.reelplexiId) return;
    const id = currentMovie.reelplexiId;
    api.get(`/movies/${currentMovie.id}`)
      .then(data => {
        if (data?.movie?.seasons) {
          const count = typeof data.movie.seasons === 'number' ? data.movie.seasons : parseInt(data.movie.seasons) || 1;
          setSeasons(Array.from({ length: count }, (_, i) => i + 1));
        } else {
          setSeasons([1]);
        }
      }).catch(() => setSeasons([1]));
  }, [isSeries, currentMovie?.id]);

  // Fetch episodes for active season
  useEffect(() => {
    if (!isSeries || !currentMovie?.reelplexiId) return;
    setLoadingEpisodes(true);
    api.get(`/movies/series/${currentMovie.reelplexiId}/season/${activeSeason}`)
      .then(data => setEpisodes(Array.isArray(data) ? data : data?.episodes || []))
      .catch(() => setEpisodes([]))
      .finally(() => setLoadingEpisodes(false));
  }, [isSeries, currentMovie?.reelplexiId, activeSeason]);

  // Mobile: lock to landscape on fullscreen
  const lockLandscape = useCallback(async () => {
    try {
      if (screen.orientation?.lock) await screen.orientation.lock('landscape');
    } catch {}
  }, []);

  const unlockOrientation = useCallback(() => {
    try { screen.orientation?.unlock?.(); } catch {}
  }, []);

  // Fullscreen toggle — on mobile uses the video element directly for true fullscreen
  const toggleFullscreen = useCallback(async () => {
    const player = playerRef.current;
    const video = videoRef.current;
    if (!player) return;

    if (!document.fullscreenElement) {
      try {
        // On mobile, request fullscreen on the video element for native landscape
        if (isMobile && video?.requestFullscreen) {
          await video.requestFullscreen();
        } else if (isMobile && video?.webkitEnterFullscreen) {
          video.webkitEnterFullscreen(); // iOS Safari
        } else {
          await player.requestFullscreen();
        }
        setIsFullscreen(true);
        lockLandscape();
      } catch (err) { console.error(err); }
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
      unlockOrientation();
    }
  }, [isMobile, lockLandscape, unlockOrientation]);

  // Listen for fullscreen change (e.g. user exits via back button)
  useEffect(() => {
    const handler = () => {
      const inFs = !!document.fullscreenElement;
      setIsFullscreen(inFs);
      if (!inFs) unlockOrientation();
    };
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
    };
  }, [unlockOrientation]);

  // Controls auto-hide
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 3500);
  }, []);

  const handleTap = useCallback(() => {
    if (showControls) {
      clearTimeout(controlsTimer.current);
      setShowControls(false);
    } else {
      resetControlsTimer();
    }
  }, [showControls, resetControlsTimer]);

  // Video source setup
  const activeVideoUrl = currentMovie.videoUrl || movie.videoUrl || '';
  const activeEmbedUrl = currentMovie.embedUrl || movie.embedUrl || '';

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeVideoUrl) return;
    let hls = null;
    if (activeVideoUrl.endsWith('.m3u8')) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = activeVideoUrl;
      } else {
        import('hls.js').then(({ default: Hls }) => {
          if (Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(activeVideoUrl);
            hls.attachMedia(video);
          }
        });
      }
    } else {
      video.src = activeVideoUrl;
    }
    const onMeta = () => {
      setDuration(video.duration);
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    };
    video.addEventListener('loadedmetadata', onMeta);
    return () => { video.removeEventListener('loadedmetadata', onMeta); hls?.destroy(); };
  }, [activeVideoUrl]);

  // Progress save
  const saveProgress = useCallback(async (seconds) => {
    if (!currentProfile.id || !currentMovie.id) return;
    try {
      await api.post('/history/progress', {
        profileId: currentProfile.id, movieId: currentMovie.id,
        progressSeconds: Math.floor(seconds),
        movieDetails: { title: currentMovie.title, thumbnailUrl: currentMovie.thumbnailUrl, backdropUrl: currentMovie.backdropUrl, videoUrl: currentMovie.videoUrl, duration: currentMovie.duration, releaseYear: currentMovie.releaseYear, rating: currentMovie.rating, genres: currentMovie.genres, type: currentMovie.type, vj: currentMovie.vj, region: currentMovie.region }
      });
    } catch {}
  }, [currentMovie, currentProfile.id]);

  useEffect(() => {
    if (currentMovie.id && currentProfile.id) saveProgress(1);
  }, [currentMovie.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && isPlaying) saveProgress(videoRef.current.currentTime);
    }, 5500);
    return () => { clearInterval(interval); if (videoRef.current) saveProgress(videoRef.current.currentTime); };
  }, [isPlaying, saveProgress]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) { v.pause(); setIsPlaying(false); }
    else { v.play().catch(() => {}); setIsPlaying(true); }
  };

  const skipSeconds = (n) => {
    const v = videoRef.current;
    if (v) v.currentTime = Math.min(Math.max(0, v.currentTime + n), duration);
  };

  const handleSeek = (e) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = parseFloat(e.target.value);
    setCurrentTime(v.currentTime);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    if (isMuted) { v.volume = volume || 0.5; setIsMuted(false); }
    else { v.volume = 0; setIsMuted(true); }
  };

  const formatTime = (s) => {
    if (isNaN(s)) return '0:00';
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    return `${m}:${String(sec).padStart(2,'0')}`;
  };

  const playEpisode = (ep) => {
    setCurrentMovie(p => ({ ...p, title: ep.title || p.title, videoUrl: ep.stream_url || ep.video_url || p.videoUrl, embedUrl: ep.embed_url || p.embedUrl, description: ep.overview || ep.description || p.description }));
    setShowEpisodes(false);
  };

  return (
    <div
      ref={playerRef}
      className="vp-root"
      onMouseMove={resetControlsTimer}
      onClick={isMobile ? handleTap : undefined}
    >
      {/* Loading */}
      {loadingStream && (
        <div className="vp-loading">
          <Loader2 className="vp-spinner" size={44} color="#e50914" />
          <span>{currentMovie.title}</span>
          {currentMovie.vj && <span className="vp-loading-vj">Voiced by {currentMovie.vj}</span>}
        </div>
      )}

      {/* Video or embed */}
      {useEmbedFallback && activeEmbedUrl ? (
        <iframe src={activeEmbedUrl} title={currentMovie.title} className="vp-embed" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
      ) : (
        <video
          ref={videoRef}
          className="vp-video"
          onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
          onError={() => activeEmbedUrl && setUseEmbedFallback(true)}
          onClick={!isMobile ? togglePlay : undefined}
          autoPlay playsInline
        />
      )}

      {/* Controls overlay */}
      <div className={`vp-controls${showControls ? ' vp-controls--visible' : ''}`}>

        {/* Top bar */}
        <div className="vp-top">
          <button className="vp-icon-btn vp-back" onClick={onClose}><ArrowLeft size={22} /></button>
          <div className="vp-top-title">
            <span>{currentMovie.title}</span>
            {currentMovie.vj && <span className="vp-vj-tag">{currentMovie.vj}</span>}
          </div>
          <div className="vp-top-right">
            {isSeries && (
              <button className="vp-icon-btn" onClick={(e) => { e.stopPropagation(); setShowEpisodes(p => !p); }} title="Episodes">
                <List size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Center play/pause tap zone on mobile */}
        {isMobile && (
          <div className="vp-center-controls">
            <button className="vp-center-btn" onClick={(e) => { e.stopPropagation(); skipSeconds(-10); }}><RotateCcw size={28} /><span>10</span></button>
            <button className="vp-center-play" onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
              {isPlaying ? <Pause size={36} fill="#fff" /> : <Play size={36} fill="#fff" />}
            </button>
            <button className="vp-center-btn" onClick={(e) => { e.stopPropagation(); skipSeconds(10); }}><RotateCw size={28} /><span>10</span></button>
          </div>
        )}

        {/* Bottom controls */}
        <div className="vp-bottom">
          {/* Seek bar */}
          <div className="vp-seek-row">
            <span className="vp-time">{formatTime(currentTime)}</span>
            <input type="range" className="vp-seek" min={0} max={duration || 100} step={0.1} value={currentTime} onChange={handleSeek} onClick={e => e.stopPropagation()} />
            <span className="vp-time">{formatTime(duration - currentTime)}</span>
          </div>

          {/* Buttons row */}
          <div className="vp-btn-row">
            <div className="vp-btn-left">
              {!isMobile && (
                <>
                  <button className="vp-icon-btn" onClick={togglePlay}>{isPlaying ? <Pause size={24} fill="#fff" /> : <Play size={24} fill="#fff" />}</button>
                  <button className="vp-icon-btn" onClick={() => skipSeconds(-10)}><RotateCcw size={20} /></button>
                  <button className="vp-icon-btn" onClick={() => skipSeconds(10)}><RotateCw size={20} /></button>
                </>
              )}
              <button className="vp-icon-btn" onClick={(e) => { e.stopPropagation(); toggleMute(); }}>
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              {!isMobile && (
                <input type="range" className="vp-vol" min={0} max={1} step={0.05} value={isMuted ? 0 : volume}
                  onChange={e => { const v = videoRef.current; if (v) { v.volume = parseFloat(e.target.value); setVolume(parseFloat(e.target.value)); setIsMuted(parseFloat(e.target.value) === 0); }}} />
              )}
            </div>
            <div className="vp-btn-right">
              {!isMobile && (
                <select className="vp-speed" value={playbackSpeed} onChange={e => { const v = videoRef.current; if (v) { v.playbackRate = parseFloat(e.target.value); setPlaybackSpeed(parseFloat(e.target.value)); }}}>
                  {[0.5,1,1.25,1.5,2].map(s => <option key={s} value={s}>{s}x</option>)}
                </select>
              )}
              <button className="vp-icon-btn" onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}>
                {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Episodes panel — slides up from bottom */}
      {isSeries && showEpisodes && (
        <div className="vp-episodes-panel" onClick={e => e.stopPropagation()}>
          <div className="vp-episodes-header">
            <span className="vp-episodes-title">Episodes</span>
            <div className="vp-season-tabs">
              {seasons.map(s => (
                <button key={s} className={`vp-season-tab${activeSeason === s ? ' vp-season-tab--active' : ''}`} onClick={() => setActiveSeason(s)}>
                  S{s}
                </button>
              ))}
            </div>
            <button className="vp-icon-btn" onClick={() => setShowEpisodes(false)}><ChevronDown size={20} /></button>
          </div>
          <div className="vp-episodes-list">
            {loadingEpisodes ? (
              <div className="vp-episodes-loading"><Loader2 size={24} className="vp-spinner" color="#e50914" /></div>
            ) : episodes.length > 0 ? episodes.map((ep, i) => (
              <div key={ep.id || i} className="vp-episode-item" onClick={() => playEpisode(ep)}>
                <div className="vp-ep-num">{ep.episode_number || i + 1}</div>
                <img className="vp-ep-thumb" src={ep.still_url || ep.thumbnail || currentMovie.thumbnailUrl} alt={ep.title} onError={e => e.target.style.display='none'} />
                <div className="vp-ep-info">
                  <div className="vp-ep-title">{ep.title || `Episode ${i + 1}`}</div>
                  {ep.runtime && <div className="vp-ep-meta">{ep.runtime}m</div>}
                  {ep.overview && <div className="vp-ep-desc">{ep.overview}</div>}
                </div>
                <Play size={16} className="vp-ep-play" />
              </div>
            )) : (
              <div className="vp-episodes-empty">No episodes available for Season {activeSeason}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
