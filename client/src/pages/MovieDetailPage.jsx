import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Plus, Check, ThumbsUp, ChevronLeft, Volume2, VolumeX, Mic, ChevronDown } from 'lucide-react';
import { api } from '../utils/api';
import Navbar from '../components/Navbar';
import VideoPlayer from '../components/VideoPlayer';
import UpgradeModal from '../components/UpgradeModal';
import SignupModal from '../components/SignupModal';

const PREVIEW_DURATION = 60000; // 60s
const PREVIEW_DELAY    = 1200;  // start after 1.2s

export default function MovieDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie]                   = useState(null);
  const [seasons, setSeasons]               = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [activeSeason, setActiveSeason]     = useState(0);
  const [loading, setLoading]               = useState(true);
  const [activeVJ, setActiveVJ]             = useState('');
  const [isMuted, setIsMuted]               = useState(true);
  const [previewPhase, setPreviewPhase]     = useState('banner'); // banner|video|fading|done
  const [watchlist, setWatchlist]           = useState([]);
  const [activePlayMovie, setActivePlayMovie] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSignupModal, setShowSignupModal]   = useState(false);
  const [seasonOpen, setSeasonOpen]         = useState(false);

  const videoRef  = useRef(null);
  const t1 = useRef(null); // delay before preview starts
  const t2 = useRef(null); // preview duration
  const t3 = useRef(null); // fade-out duration

  const cachedUser    = localStorage.getItem('netflix_user');
  const user          = cachedUser ? JSON.parse(cachedUser) : null;
  const isLoggedIn    = !!localStorage.getItem('netflix_token');
  const isSubscribed  = user?.subscriptionStatus === 'ACTIVE' && (
    user?.role === 'ADMIN' || !user?.subscriptionEnd || new Date(user.subscriptionEnd) > new Date()
  );
  const currentProfile = isLoggedIn ? JSON.parse(localStorage.getItem('netflix_profile') || 'null') : null;
  const isInWatchlist  = watchlist.some(m => m.id === movie?.id);

  // ── scroll to top on every navigation ──
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [id]);

  useEffect(() => {
    if (isLoggedIn && currentProfile) {
      api.get(`/mylist/${currentProfile.id}`).then(list => { if (list) setWatchlist(list); }).catch(() => {});
    }
  }, []);

  const clearTimers = () => {
    clearTimeout(t1.current);
    clearTimeout(t2.current);
    clearTimeout(t3.current);
  };

  const startPreview = () => {
    clearTimers();
    t1.current = setTimeout(() => {
      setPreviewPhase('video');
      t2.current = setTimeout(() => {
        setPreviewPhase('fading');
        t3.current = setTimeout(() => setPreviewPhase('done'), 800);
      }, PREVIEW_DURATION);
    }, PREVIEW_DELAY);
  };

  useEffect(() => {
    setLoading(true);
    setPreviewPhase('banner');
    setSeasons([]);
    setActiveSeason(0);
    clearTimers();

    api.get(`/movies/${id}`)
      .then(data => {
        const m = data.movie || data;
        setMovie(m);
        setActiveVJ(m.vj || 'VJ Junior');
        setSeasons(data.seasons || []);
        setRecommendations(data.recommendations || []);
        if (m.videoUrl) startPreview();
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return clearTimers;
  }, [id]);

  const replayPreview = () => {
    if (!movie?.videoUrl) return;
    startPreview();
  };

  const handlePlay = (episodeOverride = null) => {
    if (!isLoggedIn) { setShowSignupModal(true); return; }
    if (!isSubscribed) { setShowUpgradeModal(true); return; }
    if (episodeOverride) {
      setActivePlayMovie({ ...movie, activeVJ, videoUrl: episodeOverride.streamUrl || episodeOverride.embedUrl || movie.videoUrl, episodeTitle: episodeOverride.title });
    } else {
      setActivePlayMovie({ ...movie, activeVJ });
    }
  };

  const handleToggleWatchlist = async () => {
    if (!isLoggedIn) { setShowSignupModal(true); return; }
    if (!currentProfile) return;
    try {
      if (isInWatchlist) {
        await api.delete('/mylist', { profileId: currentProfile.id, movieId: movie.id });
        setWatchlist(prev => prev.filter(m => m.id !== movie.id));
      } else {
        const added = await api.post('/mylist', { profileId: currentProfile.id, movieId: movie.id });
        setWatchlist(prev => [added, ...prev]);
      }
    } catch {}
  };

  const availableVJs = [
    { name: movie?.vj || 'VJ Junior' },
    { name: 'VJ Emmy' },
    { name: 'VJ Ice P' },
  ];

  if (loading) {
    return (
      <div className="mdp-loading">
        <div className="mdp-loading-spinner" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="mdp-loading">
        <p style={{ color: '#aaa' }}>Movie not found.</p>
        <button className="mdp-back-btn" onClick={() => navigate('/browse')}>← Back to Browse</button>
      </div>
    );
  }

  const isHls    = movie.videoUrl && movie.videoUrl.endsWith('.m3u8');
  const isSeries = movie.type === 'SHOW';
  const matchPct = Math.floor(Math.random() * 15) + 85;
  const currentSeasonData = seasons[activeSeason];

  return (
    <div className="mdp-root">
      <Navbar />

      {/* ── HERO ── */}
      <div className="mdp-hero">

        {/* Backdrop — always present */}
        <img
          src={movie.backdropUrl || movie.thumbnailUrl}
          alt={movie.title}
          className={`mdp-hero-video mdp-hero-banner ${previewPhase === 'video' ? 'mdp-layer-hidden' : 'mdp-layer-visible'}`}
        />

        {/* Video preview */}
        {(previewPhase === 'video' || previewPhase === 'fading') && movie.videoUrl && (
          <div className={`mdp-hero-video mdp-video-wrap ${previewPhase === 'fading' ? 'mdp-layer-hidden' : 'mdp-layer-visible'}`}>
            {isHls
              ? <HlsPlayer src={movie.videoUrl} videoRef={videoRef} isMuted={isMuted} poster={movie.backdropUrl} />
              : <video ref={videoRef} src={movie.videoUrl} autoPlay muted={isMuted} playsInline className="mdp-hero-video" />
            }
          </div>
        )}

        <div className="mdp-hero-overlay" />

        {/* Back */}
        <button className="mdp-back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={20} /> Back
        </button>

        {/* Mute — only while video plays */}
        {(previewPhase === 'video' || previewPhase === 'fading') && (
          <button className="mdp-mute-btn" onClick={() => setIsMuted(m => !m)}>
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        )}

        {/* Replay — after preview ends */}
        {previewPhase === 'done' && movie.videoUrl && (
          <button className="mdp-replay-btn" onClick={replayPreview}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.5" />
            </svg>
            Preview
          </button>
        )}

        {/* Hero info */}
        <div className="mdp-hero-info">
          <h1 className="mdp-title">{movie.title}</h1>

          <div className="mdp-meta">
            <span className="mdp-meta-match">{matchPct}% Match</span>
            <span className="mdp-meta-year">{movie.releaseYear || movie.year}</span>
            {movie.rating && <span className="mdp-meta-badge">{movie.rating}</span>}
            <span className="mdp-meta-type">{isSeries ? 'SERIES' : 'MOVIE'}</span>
            {movie.duration && <span className="mdp-meta-dur">{movie.duration}</span>}
          </div>

          {/* Season selector — right in the hero for series */}
          {isSeries && seasons.length > 1 && (
            <div className="mdp-season-selector">
              <button className="mdp-season-dropdown-btn" onClick={() => setSeasonOpen(o => !o)}>
                Season {seasons[activeSeason]?.season ?? activeSeason + 1}
                <ChevronDown size={15} style={{ transition: 'transform 0.2s', transform: seasonOpen ? 'rotate(180deg)' : 'none' }} />
              </button>
              {seasonOpen && (
                <div className="mdp-season-dropdown">
                  {seasons.map((s, i) => (
                    <button
                      key={s.season}
                      className={`mdp-season-option${activeSeason === i ? ' active' : ''}`}
                      onClick={() => { setActiveSeason(i); setSeasonOpen(false); }}
                    >
                      Season {s.season}
                      <span className="mdp-season-ep-count">{s.episodes.length} ep{s.episodes.length !== 1 ? 's' : ''}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mdp-actions">
            <button className="mdp-play-btn" onClick={() => handlePlay()}>
              <Play size={18} fill="#000" color="#000" />
              {isSubscribed
                ? isSeries ? `Play S${seasons[activeSeason]?.season ?? 1} E1 · ${activeVJ}` : `Play · ${activeVJ}`
                : '🔒 Subscribe to Watch'}
            </button>
            <button className="mdp-icon-btn" onClick={handleToggleWatchlist} title={isInWatchlist ? 'Remove from list' : 'Add to list'}>
              {isInWatchlist ? <Check size={20} color="#46d369" /> : <Plus size={20} color="#fff" />}
            </button>
            <button className="mdp-icon-btn" title="Like">
              <ThumbsUp size={20} color="#fff" />
            </button>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="mdp-body">

        <p className="mdp-desc">{movie.description}</p>

        {/* VJ selector */}
        <div className="mdp-vj-section">
          <div className="mdp-section-label"><Mic size={13} color="#e50914" /> Audio Version</div>
          <div className="mdp-vj-pills">
            {availableVJs.map(vj => (
              <button
                key={vj.name}
                className={`mdp-vj-pill${activeVJ === vj.name ? ' active' : ''}`}
                onClick={() => setActiveVJ(vj.name)}
              >
                {vj.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mdp-details-row">
          {movie.genres && <span><strong>Genres:</strong> {movie.genres}</span>}
          {movie.originCountry && <span><strong>Country:</strong> {movie.originCountry}</span>}
          <span><strong>Audio:</strong> Luganda Voiceover</span>
        </div>

        {/* ── EPISODES ── */}
        {isSeries && seasons.length > 0 && (
          <div className="mdp-episodes">
            <div className="mdp-episodes-header">
              <h2 className="mdp-more-title">Episodes</h2>

              {/* Season tabs — shown in body too for easy switching */}
              {seasons.length > 1 && (
                <div className="mdp-season-tabs">
                  {seasons.map((s, i) => (
                    <button
                      key={s.season}
                      className={`mdp-season-tab${activeSeason === i ? ' active' : ''}`}
                      onClick={() => setActiveSeason(i)}
                    >
                      S{s.season}
                      <span className="mdp-season-tab-count">{s.episodes.length}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {currentSeasonData && (
              <div className="mdp-ep-list">
                {currentSeasonData.episodes.map((ep, idx) => (
                  <div key={ep.id || idx} className="mdp-ep-row" onClick={() => handlePlay(ep)}>
                    <div className="mdp-ep-num">{ep.episode || idx + 1}</div>
                    <div className="mdp-ep-thumb">
                      {ep.thumbnailUrl
                        ? <img src={ep.thumbnailUrl} alt={ep.title} />
                        : <div className="mdp-ep-thumb-placeholder"><Play size={20} color="#fff" /></div>
                      }
                      <div className="mdp-ep-play-overlay"><Play size={18} fill="#fff" color="#fff" /></div>
                    </div>
                    <div className="mdp-ep-info">
                      <p className="mdp-ep-title">{ep.title}</p>
                      {ep.duration && <span className="mdp-ep-dur">{ep.duration}</span>}
                      {ep.description && <p className="mdp-ep-desc">{ep.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MORE LIKE THIS ── */}
        {recommendations.length > 0 && (
          <div className="mdp-more">
            <h2 className="mdp-more-title">More Like This</h2>
            <div className="mdp-recs-grid">
              {recommendations.map(rec => (
                <div
                  key={rec.id}
                  className="mdp-rec-card"
                  onClick={() => { navigate(`/movie/${rec.id}`); }}
                >
                  <div className="mdp-rec-thumb">
                    <img src={rec.thumbnailUrl} alt={rec.title} />
                    <div className="mdp-rec-thumb-overlay" />
                    <button className="mdp-rec-play"><Play size={16} fill="#fff" color="#fff" /></button>
                  </div>
                  <div className="mdp-rec-info">
                    <div className="mdp-rec-meta">
                      {rec.rating && <span className="mdp-meta-badge">{rec.rating}</span>}
                      {rec.duration && <span className="mdp-rec-dur">{rec.duration}</span>}
                    </div>
                    <p className="mdp-rec-title">{rec.title}</p>
                    <p className="mdp-rec-desc">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {activePlayMovie && (
        <VideoPlayer movie={activePlayMovie} onClose={() => setActivePlayMovie(null)} />
      )}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        movie={movie}
        onSubscriptionSuccess={(updatedUser, movieToPlay) => {
          setShowUpgradeModal(false);
          if (movieToPlay) setActivePlayMovie(movieToPlay);
        }}
      />
      <SignupModal isOpen={showSignupModal} onClose={() => setShowSignupModal(false)} />
    </div>
  );
}

function HlsPlayer({ src, videoRef, isMuted, poster }) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let hls = null;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    } else {
      import('hls.js').then(Hls => {
        if (Hls.default.isSupported()) {
          hls = new Hls.default();
          hls.loadSource(src);
          hls.attachMedia(video);
        }
      });
    }
    return () => { if (hls) hls.destroy(); };
  }, [src, videoRef]);

  return <video ref={videoRef} autoPlay muted={isMuted} playsInline poster={poster} className="mdp-hero-video" />;
}
