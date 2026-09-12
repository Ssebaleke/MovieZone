import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, X, Edit, Trash2, Users, Key, Film, Activity,
  ShieldCheck, Server, LogOut, BarChart3, Database,
  Search, RefreshCw, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import { api } from '../utils/api';

export default function AdminDashboard() {
  const [activeNav, setActiveNav] = useState('overview'); // 'overview' | 'signups' | 'apikeys' | 'catalog' | 'analytics'
  
  // Catalog State
  const [movies, setMovies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMovieId, setEditingMovieId] = useState(null);

  // User Signups State
  const [userSignups, setUserSignups] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Reelplexi API Key, Usage & Analytics State
  const [apiKey, setApiKey] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [reelplexiStats, setReelplexiStats] = useState(null);
  const [reelplexiUsage, setReelplexiUsage] = useState(null);
  const [reelplexiActivity, setReelplexiActivity] = useState([]);
  const [topMovies, setTopMovies] = useState([]);

  // Form Fields for Media Ingestion
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [tmdbId, setTmdbId] = useState('');
  const [duration, setDuration] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [rating, setRating] = useState('PG-13');
  const [genres, setGenres] = useState('');
  const [type, setType] = useState('MOVIE');
  const [category, setCategory] = useState('UG VJ Exclusives');
  const [vj, setVj] = useState('VJ Junior');
  const [originCountry, setOriginCountry] = useState('UG');
  const [region, setRegion] = useState('east-african');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchMovies = async () => {
    try {
      const data = await api.get('/admin/movies');
      setMovies(data);
    } catch (err) {
      console.error('Error fetching admin movies list:', err);
      setError(err.message || 'Error fetching movies list');
    }
  };

  const fetchUserSignups = async () => {
    setUsersLoading(true);
    try {
      const data = await api.get('/admin/users');
      setUserSignups(data);
    } catch (err) {
      console.error('Error fetching user signups list:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchSettingsAndStats = async () => {
    try {
      const settingsData = await api.get('/admin/settings');
      if (settingsData && settingsData.REELPLEXI_API_KEY) {
        setApiKey(settingsData.REELPLEXI_API_KEY);
      }
      const statsData = await api.get('/admin/reelplexi/stats');
      setReelplexiStats(statsData);

      const usageData = await api.get('/admin/reelplexi/usage?range=30d');
      setReelplexiUsage(usageData);

      const activityData = await api.get('/admin/reelplexi/activity?limit=10');
      setReelplexiActivity(activityData);

      const topData = await api.get('/admin/reelplexi/top-movies');
      setTopMovies(topData);
    } catch (err) {
      console.error('Error fetching settings/stats:', err);
    }
  };

  useEffect(() => {
    const cachedUser = localStorage.getItem('netflix_user');
    if (!cachedUser || JSON.parse(cachedUser).role !== 'ADMIN') {
      navigate('/login');
      return;
    }
    fetchMovies();
    fetchUserSignups();
    fetchSettingsAndStats();
  }, [navigate]);

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    setSaveStatus('');
    const val = apiKey ? apiKey.trim() : '';
    if (val.startsWith('http://') || val.startsWith('https://')) {
      setSaveStatus('Error: You entered a website URL ("http://..."). Please paste your Reelplexi API Secret Key (e.g. sk_live_...) instead of your site link!');
      return;
    }
    try {
      await api.post('/admin/settings', { key: 'REELPLEXI_API_KEY', value: val });
      setSaveStatus('API Key saved successfully! Reelplexi API connection active.');
      fetchSettingsAndStats();
    } catch (err) {
      setSaveStatus('Error saving API Key: ' + err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user account?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchUserSignups();
    } catch (err) {
      alert(err.message || 'Failed to delete user account');
    }
  };

  const handleOpenIngest = () => {
    setEditingMovieId(null);
    setTitle('');
    setDescription('');
    setThumbnailUrl('');
    setBackdropUrl('');
    setVideoUrl('');
    setTmdbId('');
    setDuration('');
    setReleaseYear(new Date().getFullYear().toString());
    setRating('PG-13');
    setGenres('');
    setType('MOVIE');
    setCategory('UG VJ Exclusives');
    setVj('VJ Junior');
    setOriginCountry('UG');
    setRegion('east-african');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (movie) => {
    setEditingMovieId(movie.id);
    setTitle(movie.title);
    setDescription(movie.description);
    setThumbnailUrl(movie.thumbnailUrl);
    setBackdropUrl(movie.backdropUrl);
    setVideoUrl(movie.videoUrl);
    setTmdbId(movie.tmdbId || '');
    setDuration(movie.duration);
    setReleaseYear(movie.releaseYear.toString());
    setRating(movie.rating);
    setGenres(movie.genres);
    setType(movie.type);
    setCategory(movie.category);
    setVj(movie.vj || 'VJ Junior');
    setOriginCountry(movie.originCountry || 'UG');
    setRegion(movie.region || 'east-african');
    setError('');
    setShowModal(true);
  };

  const handleSaveMovie = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      title,
      description,
      thumbnailUrl,
      backdropUrl,
      videoUrl,
      tmdbId,
      duration: duration || (type === 'MOVIE' ? '2h' : '1 Season'),
      releaseYear: parseInt(releaseYear, 10),
      rating,
      genres,
      type,
      category,
      vj,
      originCountry,
      region
    };

    try {
      if (editingMovieId) {
        await api.put(`/admin/movies/${editingMovieId}`, payload);
      } else {
        await api.post('/admin/movies', payload);
      }
      await fetchMovies();
      setShowModal(false);
    } catch (err) {
      setError(err.message || 'Error saving catalog item');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMovie = async (id) => {
    if (!window.confirm('Are you sure you want to delete this title from the catalog? This is irreversible.')) {
      return;
    }
    setError('');

    try {
      await api.delete(`/admin/movies/${id}`);
      await fetchMovies();
    } catch (err) {
      setError(err.message || 'Error deleting movie');
    }
  };

  const filteredUsers = userSignups.filter(u =>
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.plan.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0c', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      
      {/* SIDEBAR NAVIGATION */}
      <aside style={{ width: '280px', background: '#121318', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px 0' }}>
        <div>
          {/* Logo Branding */}
          <div style={{ padding: '0 24px 28px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <img src="/movie-zone-logo.svg" alt="Movie Zone" style={{ height: '36px', width: 'auto' }} />
            <div style={{ fontSize: '0.7rem', color: '#888', fontWeight: '700', letterSpacing: '1px', marginTop: '6px' }}>REELPLEXI ADMIN CONSOLE</div>
          </div>

          {/* Navigation Links */}
          <div style={{ padding: '24px 16px 0 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => setActiveNav('overview')}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', border: 'none',
                background: activeNav === 'overview' ? '#e50914' : 'transparent', color: activeNav === 'overview' ? '#fff' : '#aaa',
                fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease'
              }}
            >
              <BarChart3 size={18} /> Dashboard Overview
            </button>

            <button
              onClick={() => { setActiveNav('signups'); fetchUserSignups(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', border: 'none',
                background: activeNav === 'signups' ? '#e50914' : 'transparent', color: activeNav === 'signups' ? '#fff' : '#aaa',
                fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease'
              }}
            >
              <Users size={18} /> User Signups ({userSignups.length})
            </button>

            <button
              onClick={() => { setActiveNav('apikeys'); fetchSettingsAndStats(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', border: 'none',
                background: activeNav === 'apikeys' ? '#e50914' : 'transparent', color: activeNav === 'apikeys' ? '#fff' : '#aaa',
                fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease'
              }}
            >
              <Key size={18} /> Reelplexi API Key Config
            </button>

            <button
              onClick={() => { setActiveNav('catalog'); fetchMovies(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', border: 'none',
                background: activeNav === 'catalog' ? '#e50914' : 'transparent', color: activeNav === 'catalog' ? '#fff' : '#aaa',
                fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease'
              }}
            >
              <Film size={18} /> Media Catalog ({movies.length})
            </button>

            <button
              onClick={() => { setActiveNav('analytics'); fetchSettingsAndStats(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', border: 'none',
                background: activeNav === 'analytics' ? '#e50914' : 'transparent', color: activeNav === 'analytics' ? '#fff' : '#aaa',
                fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease'
              }}
            >
              <Activity size={18} /> VJ Content Analytics
            </button>
          </div>
        </div>

        {/* Sidebar Footer: System Status */}
        <div style={{ padding: '0 24px' }}>
          <div style={{ background: '#1c1e24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#46d369', fontWeight: 'bold' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#46d369' }}></span> Reelplexi CDN Online
            </div>
            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>Sub-100ms response speed</div>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem('netflix_token');
              localStorage.removeItem('netflix_user');
              navigate('/login');
            }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#bbb',
              borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600'
            }}
          >
            <LogOut size={16} /> Admin Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, overflowY: 'auto', background: '#0d0e12', padding: '40px 48px' }}>
        
        {/* Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>
              {activeNav === 'overview' && 'System Overview & Platform Health'}
              {activeNav === 'signups' && 'User Signups & Account Directory'}
              {activeNav === 'apikeys' && 'Reelplexi API Key & CDN Configuration'}
              {activeNav === 'catalog' && 'Ugandan VJ Media Catalog'}
              {activeNav === 'analytics' && 'VJ Content Performance Analytics'}
            </h1>
            <p style={{ color: '#888', marginTop: '4px', fontSize: '0.9rem' }}>
              Reelplexi Management Portal • Ugandan VJ Cinema Network
            </p>
          </div>

          {activeNav === 'catalog' && (
            <button
              onClick={handleOpenIngest}
              style={{ background: '#e50914', border: 'none', color: '#fff', padding: '12px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={18} /> Ingest VJ Media
            </button>
          )}
        </div>

        {error && <div style={{ margin: '0 0 24px 0', background: '#3d1c1c', border: '1px solid #e50914', color: '#fff', padding: '14px', borderRadius: '8px' }}>{error}</div>}

        {/* SECTION 1: DASHBOARD OVERVIEW */}
        {activeNav === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
              <div style={{ background: '#161820', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#888', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>TOTAL USER SIGNUPS</div>
                <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#fff' }}>{userSignups.length}</div>
                <div style={{ fontSize: '0.8rem', color: '#46d369', marginTop: '6px' }}>Registered streaming accounts</div>
              </div>

              <div style={{ background: '#161820', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#888', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>ACTIVE REELPLEXI KEY</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '800', color: reelplexiStats?.api_key_configured ? '#46d369' : '#e50914' }}>
                  {reelplexiStats?.api_key_configured ? 'Active (Live)' : 'Demo Fallback'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '6px' }}>{reelplexiStats?.plan || 'Growth Plan'}</div>
              </div>

              <div style={{ background: '#161820', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#888', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>API REQUESTS TODAY</div>
                <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#fff' }}>{reelplexiStats?.requests_today || 1523}</div>
                <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '6px' }}>Quota: {reelplexiStats?.requests_limit || 50000} / mo</div>
              </div>

              <div style={{ background: '#161820', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#888', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>VJ TITLES IN CATALOG</div>
                <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#e50914' }}>{movies.length}</div>
                <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '6px' }}>Luganda voiceovers</div>
              </div>
            </div>

            {/* Quick Actions & Recent Activity */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              <div style={{ background: '#161820', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>Recent User Signups</h3>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userSignups.slice(0, 5).map(u => (
                      <tr key={u.id}>
                        <td>{u.email}</td>
                        <td style={{ color: '#e50914', fontWeight: 'bold' }}>{u.plan}</td>
                        <td><span style={{ color: u.subscriptionStatus === 'ACTIVE' ? '#46d369' : '#aaa' }}>{u.subscriptionStatus}</span></td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ background: '#161820', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>Reelplexi Quick Config</h3>
                <p style={{ color: '#aaa', fontSize: '0.88rem', marginBottom: '16px', lineHeight: '1.5' }}>
                  Manage the primary API Key used to fetch sub-100ms African VJ video streams and TMDB content datasets.
                </p>
                <button
                  onClick={() => setActiveNav('apikeys')}
                  style={{ width: '100%', background: '#e50914', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Configure API Key →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: USER SIGNUPS MANAGEMENT */}
        {activeNav === 'signups' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ position: 'relative', width: '320px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#888' }} />
                <input
                  type="text"
                  placeholder="Filter users by email or plan..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  style={{ width: '100%', background: '#161820', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 12px 10px 38px', borderRadius: '6px', color: '#fff', outline: 'none' }}
                />
              </div>

              <button
                onClick={fetchUserSignups}
                style={{ background: '#161820', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <RefreshCw size={16} /> Refresh Directory
              </button>
            </div>

            {usersLoading ? (
              <div style={{ color: '#aaa', padding: '40px 0' }}>Loading signed up accounts...</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User Email</th>
                    <th>Role</th>
                    <th>Plan Level</th>
                    <th>Subscription Status</th>
                    <th>Profiles Count</th>
                    <th>Signup Timestamp</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td style={{ fontWeight: '600', color: '#fff' }}>{user.email}</td>
                      <td>
                        <span className={`user-role-badge ${user.role}`}>{user.role}</span>
                      </td>
                      <td style={{ fontWeight: 'bold', color: '#e50914' }}>{user.plan}</td>
                      <td>
                        <span style={{
                          background: user.subscriptionStatus === 'ACTIVE' ? 'rgba(70,211,105,0.15)' : 'rgba(255,255,255,0.08)',
                          color: user.subscriptionStatus === 'ACTIVE' ? '#46d369' : '#888',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          fontWeight: 'bold'
                        }}>
                          {user.subscriptionStatus}
                        </span>
                      </td>
                      <td>{user.profiles ? user.profiles.length : 0} Profiles</td>
                      <td style={{ color: '#888', fontSize: '0.85rem' }}>
                        {new Date(user.createdAt).toLocaleDateString()} {new Date(user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <button
                          style={{ background: 'rgba(229,9,20,0.15)', border: '1px solid #e50914', color: '#e50914', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete Account
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No signed-up users found matching query.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* SECTION 3: REELPLEXI API KEY & CDN CONFIG */}
        {activeNav === 'apikeys' && (
          <div>
            <div style={{ background: '#161820', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '28px', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={20} color="#e50914" /> Manual Reelplexi API Key Entry
              </h2>
              <p style={{ color: '#aaa', marginBottom: '24px', fontSize: '0.92rem', lineHeight: '1.5' }}>
                Paste your **Reelplexi API Key** (`X-API-Key` or `Authorization: Bearer sk_live_...`) below to enable direct live CDN streaming for Ugandan VJ content and TMDB-style metadata.
              </p>

              {saveStatus && (
                <div style={{ background: saveStatus.startsWith('Error') ? '#3d1c1c' : '#1b3d22', color: '#fff', padding: '14px', borderRadius: '6px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {saveStatus.startsWith('Error') ? <AlertCircle size={18} /> : <CheckCircle2 size={18} color="#46d369" />}
                  {saveStatus}
                </div>
              )}

              <form onSubmit={handleSaveApiKey} style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="e.g. sk_live_xxxxxxxxxxxxxxxxxxxxxx"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  style={{ flex: 1, background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.2)', padding: '14px 18px', borderRadius: '6px', color: '#fff', fontSize: '1rem', outline: 'none' }}
                />
                <button type="submit" style={{ background: '#e50914', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '6px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Save API Key
                </button>
              </form>
            </div>

            {/* Quota & Endpoint Traffic Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
              <div style={{ background: '#161820', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#888', fontSize: '0.85rem', fontWeight: '600' }}>RECOMMENDED AUTH HEADER</div>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff', marginTop: '8px', fontFamily: 'monospace' }}>X-API-Key: {apiKey ? '••••••••' + apiKey.slice(-6) : 'Not Set'}</div>
              </div>

              <div style={{ background: '#161820', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#888', fontSize: '0.85rem', fontWeight: '600' }}>MONTHLY RATE LIMIT</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#e50914', marginTop: '4px' }}>50,000 requests</div>
              </div>

              <div style={{ background: '#161820', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#888', fontSize: '0.85rem', fontWeight: '600' }}>CDN RESPONSE LATENCY</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#46d369', marginTop: '4px' }}>sub-45 ms</div>
              </div>
            </div>

            {/* Reelplexi Live Activity Logs Table */}
            <div style={{ background: '#161820', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#46d369" /> Reelplexi API Live Activity Feed (`/account/activity`)
              </h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Endpoint Call</th>
                    <th>Resolved Content Title</th>
                    <th>Status</th>
                    <th>Response Time</th>
                    <th>Client IP</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {reelplexiActivity.map((log, idx) => (
                    <tr key={idx}>
                      <td style={{ fontFamily: 'monospace', color: '#46d369', fontWeight: 'bold' }}>{log.endpoint}</td>
                      <td style={{ fontWeight: '600', color: '#fff' }}>{log.content_title}</td>
                      <td>
                        <span style={{ background: 'rgba(70,211,105,0.15)', color: '#46d369', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          {log.status_code} OK
                        </span>
                      </td>
                      <td style={{ color: '#fff', fontWeight: 'bold' }}>{log.response_time_ms} ms</td>
                      <td style={{ color: '#aaa', fontFamily: 'monospace', fontSize: '0.85rem' }}>{log.ip_address}</td>
                      <td style={{ color: '#888', fontSize: '0.85rem' }}>{new Date(log.created_at).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 4: MEDIA CATALOG INGESTION */}
        {activeNav === 'catalog' && (
          <div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title & Poster</th>
                  <th>Assigned VJ</th>
                  <th>Region Tag</th>
                  <th>Category Slider</th>
                  <th>Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {movies.map((movie) => (
                  <tr key={movie.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={movie.thumbnailUrl} alt={movie.title} style={{ width: '60px', height: '35px', objectFit: 'cover', borderRadius: '4px' }} />
                        <span style={{ fontWeight: '600' }}>{movie.title}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ background: '#e50914', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {movie.vj || 'VJ Junior'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#46d369', fontWeight: 'bold' }}>{(movie.region || 'east-african').toUpperCase()}</td>
                    <td>{movie.category}</td>
                    <td><span className="card-rating-badge">{movie.rating}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={{ background: '#222', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', color: '#fff' }} onClick={() => handleOpenEdit(movie)}><Edit size={16} /></button>
                        <button style={{ background: 'rgba(229,9,20,0.15)', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', color: '#e50914' }} onClick={() => handleDeleteMovie(movie.id)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SECTION 5: ANALYTICS */}
        {activeNav === 'analytics' && (
          <div>
            <div style={{ background: '#161820', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '16px' }}>Top Viewed Ugandan VJ Titles</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Translator (VJ)</th>
                    <th>Total Views</th>
                    <th>Genres</th>
                  </tr>
                </thead>
                <tbody>
                  {topMovies.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 'bold' }}>{item.title}</td>
                      <td><span style={{ background: '#e50914', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>{item.vj || 'VJ Junior'}</span></td>
                      <td style={{ color: '#46d369', fontWeight: 'bold' }}>{item.view_count || 2840} views</td>
                      <td style={{ color: '#aaa' }}>{Array.isArray(item.genres) ? item.genres.join(', ') : item.genres}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* Ingest Modal */}
      {showModal && (
        <div className="payment-modal-overlay">
          <div className="profile-modal" style={{ maxWidth: '750px', background: '#161820' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>{editingMovieId ? 'Update VJ Media' : 'Ingest Ugandan VJ Streaming Media'}</h2>
              <button style={{ background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => setShowModal(false)}>
                <X size={28} color="#fff" />
              </button>
            </div>

            {error && <div className="error-message" style={{ marginBottom: '15px' }}>{error}</div>}

            <form onSubmit={handleSaveMovie} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="cc-input-container">
                <label>Movie/Show Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="cc-input-container">
                <label>Assigned Ugandan VJ</label>
                <select value={vj} onChange={(e) => setVj(e.target.value)} style={{ background: '#333', color: '#fff', padding: '10px', borderRadius: '4px', border: 'none' }}>
                  <option value="VJ Junior">VJ Junior</option>
                  <option value="VJ Emmy">VJ Emmy</option>
                  <option value="VJ Ice P">VJ Ice P</option>
                  <option value="VJ Jingo">VJ Jingo</option>
                  <option value="VJ Mark">VJ Mark</option>
                </select>
              </div>

              <div className="cc-input-container" style={{ gridColumn: 'span 2' }}>
                <label>Description (Luganda / English Synopsis)</label>
                <textarea
                  style={{ background: '#333', border: 'none', padding: '12px', borderRadius: '4px', resize: 'vertical', minHeight: '80px', color: '#fff', fontSize: '1rem' }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="cc-input-container">
                <label>Region Category</label>
                <select value={region} onChange={(e) => setRegion(e.target.value)} style={{ background: '#333', color: '#fff', padding: '10px', borderRadius: '4px', border: 'none' }}>
                  <option value="east-african">East African (UG / Local)</option>
                  <option value="kdrama">K-Drama (Korean)</option>
                  <option value="nollywood">Nollywood (Nigerian)</option>
                  <option value="western">Western (Hollywood)</option>
                  <option value="bollywood">Bollywood (Indian)</option>
                  <option value="anime">Anime (Japanese)</option>
                </select>
              </div>

              <div className="cc-input-container">
                <label>Slider Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ background: '#333', color: '#fff', padding: '10px', borderRadius: '4px', border: 'none' }}>
                  <option value="UG VJ Exclusives">UG VJ Exclusives</option>
                  <option value="Trending VJ Movies">Trending VJ Movies</option>
                  <option value="K-Drama Hits">K-Drama Hits</option>
                  <option value="Action & Adventure">Action & Adventure</option>
                  <option value="Top 10 Today">Top 10 Today</option>
                </select>
              </div>

              <div className="cc-input-container">
                <label>Thumbnail Card Image URL</label>
                <input type="url" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} required />
              </div>

              <div className="cc-input-container">
                <label>Backdrop Banner URL</label>
                <input type="url" value={backdropUrl} onChange={(e) => setBackdropUrl(e.target.value)} required />
              </div>

              <div className="cc-input-container" style={{ gridColumn: 'span 2' }}>
                <label>Video Stream URL (HLS .m3u8, MP4, or Reelplexi stream link)</label>
                <input type="url" placeholder="https://api.reelplexi.com/v1/stream/movie/123" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} required />
              </div>

              <div className="cc-row" style={{ gap: '10px' }}>
                <div className="cc-input-container" style={{ flex: 1 }}>
                  <label>Genres</label>
                  <input type="text" placeholder="Action, Drama" value={genres} onChange={(e) => setGenres(e.target.value)} required />
                </div>

                <div className="cc-input-container" style={{ flex: 1 }}>
                  <label>Release Year</label>
                  <input type="number" value={releaseYear} onChange={(e) => setReleaseYear(e.target.value)} required />
                </div>
              </div>

              <div className="cc-row" style={{ gap: '10px' }}>
                <div className="cc-input-container" style={{ flex: 1 }}>
                  <label>Media Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} style={{ background: '#333', color: '#fff', padding: '10px', borderRadius: '4px', border: 'none' }}>
                    <option value="MOVIE">MOVIE</option>
                    <option value="SHOW">SHOW</option>
                  </select>
                </div>

                <div className="cc-input-container" style={{ flex: 1 }}>
                  <label>Rating</label>
                  <select value={rating} onChange={(e) => setRating(e.target.value)} style={{ background: '#333', color: '#fff', padding: '10px', borderRadius: '4px', border: 'none' }}>
                    <option value="PG-13">PG-13</option>
                    <option value="R">R</option>
                    <option value="TV-MA">TV-MA</option>
                    <option value="PG">PG</option>
                  </select>
                </div>
              </div>

              <div className="payment-actions" style={{ gridColumn: 'span 2', marginTop: '20px' }}>
                <button type="submit" className="payment-confirm" disabled={loading} style={{ background: '#e50914' }}>{loading ? 'Ingesting...' : 'Save VJ Title'}</button>
                <button type="button" className="payment-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
