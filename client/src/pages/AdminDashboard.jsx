import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, X, Edit, Trash2, Users, Key, Film, Activity,
  ShieldCheck, Server, LogOut, BarChart3, Database,
  Search, RefreshCw, CheckCircle2, AlertCircle, Clock, Package as PackageIcon, Check, CreditCard, Smartphone, DollarSign
} from 'lucide-react';
import { api } from '../utils/api';

export default function AdminDashboard() {
  const [activeNav, setActiveNav] = useState('overview'); // 'overview' | 'signups' | 'apikeys' | 'catalog' | 'analytics' | 'packages'
  
  // Catalog State
  const [movies, setMovies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMovieId, setEditingMovieId] = useState(null);

  // Packages State
  const [packagesList, setPackagesList] = useState([]);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState(null);
  const [pkgName, setPkgName] = useState('');
  const [pkgPrice, setPkgPrice] = useState('');
  const [pkgCurrency, setPkgCurrency] = useState('UGX');
  const [pkgDurationVal, setPkgDurationVal] = useState(1);
  const [pkgDurationUnit, setPkgDurationUnit] = useState('MONTHS');
  const [pkgDescription, setPkgDescription] = useState('');
  const [pkgFeatures, setPkgFeatures] = useState('');
  const [pkgResolution, setPkgResolution] = useState('1080p Full HD');
  const [pkgScreens, setPkgScreens] = useState(2);
  const [pkgIsActive, setPkgIsActive] = useState(true);

  // Parse interval string into value and unit
  const parseInterval = (str) => {
    if (!str) return { val: 1, unit: 'MONTHS' };
    const s = String(str).toUpperCase().trim();
    const m = s.match(/^(\d+)[_\s:]*([A-Z]+)$/);
    if (m) {
      let u = m[2];
      if (u.startsWith('MIN')) u = 'MINUTES';
      else if (u.startsWith('HOUR') || u.startsWith('HR')) u = 'HOURS';
      else if (u.startsWith('DAY')) u = 'DAYS';
      else if (u.startsWith('WEEK')) u = 'WEEKS';
      else if (u.startsWith('MONTH')) u = 'MONTHS';
      else if (u.startsWith('YEAR')) u = 'YEARS';
      return { val: parseInt(m[1], 10), unit: u };
    }
    if (s === 'DAILY') return { val: 1, unit: 'DAYS' };
    if (s === 'WEEKLY') return { val: 7, unit: 'DAYS' };
    if (s === 'MONTHLY') return { val: 1, unit: 'MONTHS' };
    if (s === 'YEARLY') return { val: 1, unit: 'YEARS' };
    return { val: 1, unit: 'MONTHS' };
  };

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

  // LivePay Payment Gateway State
  const [livepayApiKey, setLivepayApiKey] = useState('');
  const [livepayAccountNumber, setLivepayAccountNumber] = useState('');
  const [livepayEnabled, setLivepayEnabled] = useState(true);
  const [livepaySaveStatus, setLivepaySaveStatus] = useState('');
  const [livepayTestResult, setLivepayTestResult] = useState(null);
  const [testingLivepay, setTestingLivepay] = useState(false);

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

  const fetchPackages = async () => {
    try {
      const data = await api.get('/admin/packages');
      setPackagesList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching admin packages:', err);
      setPackagesList([]);
    }
  };

  const handleOpenPackageModal = (pkg = null) => {
    setError('');
    if (pkg) {
      setEditingPackageId(pkg.id);
      setPkgName(pkg.name);
      setPkgPrice(pkg.price);
      setPkgCurrency(pkg.currency || 'UGX');
      const parsed = parseInterval(pkg.interval);
      setPkgDurationVal(parsed.val);
      setPkgDurationUnit(parsed.unit);
      setPkgDescription(pkg.description || '');
      setPkgFeatures(pkg.features || '');
      setPkgResolution(pkg.resolution || '1080p Full HD');
      setPkgScreens(pkg.screens || 2);
      setPkgIsActive(pkg.isActive !== undefined ? pkg.isActive : true);
    } else {
      setEditingPackageId(null);
      setPkgName('');
      setPkgPrice('');
      setPkgCurrency('UGX');
      setPkgDurationVal(30);
      setPkgDurationUnit('DAYS');
      setPkgDescription('');
      setPkgFeatures('');
      setPkgResolution('1080p Full HD');
      setPkgScreens(2);
      setPkgIsActive(true);
    }
    setShowPackageModal(true);
  };

  const handleSavePackage = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const val = parseInt(pkgDurationVal, 10) || 0;
    const intervalStr = `${val}_${pkgDurationUnit}`;

    const payload = {
      name: pkgName,
      price: parseFloat(pkgPrice),
      currency: pkgCurrency,
      interval: intervalStr,
      description: pkgDescription,
      features: pkgFeatures,
      resolution: pkgResolution,
      screens: parseInt(pkgScreens, 10),
      isActive: pkgIsActive
    };

    try {
      if (editingPackageId) {
        await api.put(`/admin/packages/${editingPackageId}`, payload);
      } else {
        await api.post('/admin/packages', payload);
      }
      await fetchPackages();
      setShowPackageModal(false);
    } catch (err) {
      setError(err.message || 'Error saving subscription package');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePackage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscription package?')) return;
    try {
      await api.delete(`/admin/packages/${id}`);
      await fetchPackages();
    } catch (err) {
      setError(err.message || 'Error deleting package');
    }
  };

  const fetchMovies = async () => {
    try {
      const data = await api.get('/admin/movies');
      setMovies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching admin movies list:', err);
      setError(err.message || 'Error fetching movies list');
      setMovies([]);
    }
  };

  const fetchUserSignups = async () => {
    setUsersLoading(true);
    try {
      const data = await api.get('/admin/users');
      setUserSignups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching user signups list:', err);
      setUserSignups([]);
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
      if (settingsData && settingsData.settings) {
        if (settingsData.settings.LIVEPAY_API_KEY) setLivepayApiKey(settingsData.settings.LIVEPAY_API_KEY);
        if (settingsData.settings.LIVEPAY_ACCOUNT_NUMBER) setLivepayAccountNumber(settingsData.settings.LIVEPAY_ACCOUNT_NUMBER);
        if (settingsData.settings.LIVEPAY_ENABLED !== undefined) setLivepayEnabled(settingsData.settings.LIVEPAY_ENABLED !== 'false');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }

    try {
      const statsData = await api.get('/admin/reelplexi/stats');
      setReelplexiStats(statsData);
    } catch (err) {}

    try {
      const usageData = await api.get('/admin/reelplexi/usage?range=30d');
      setReelplexiUsage(usageData);
    } catch (err) {}

    try {
      const activityData = await api.get('/admin/reelplexi/activity?limit=10');
      setReelplexiActivity(Array.isArray(activityData) ? activityData : []);
    } catch (err) {
      setReelplexiActivity([]);
    }

    try {
      const topData = await api.get('/admin/reelplexi/top-movies');
      setTopMovies(Array.isArray(topData) ? topData : []);
    } catch (err) {
      setTopMovies([]);
    }
  };

  const handleSaveLivepaySettings = async (e) => {
    e.preventDefault();
    setLivepaySaveStatus('');
    try {
      await api.post('/admin/settings', {
        settings: {
          LIVEPAY_API_KEY: livepayApiKey.trim(),
          LIVEPAY_ACCOUNT_NUMBER: livepayAccountNumber.trim(),
          LIVEPAY_ENABLED: livepayEnabled ? 'true' : 'false'
        }
      });
      setLivepaySaveStatus('LivePay Payment Gateway settings saved successfully!');
    } catch (err) {
      setLivepaySaveStatus('Error saving LivePay settings: ' + err.message);
    }
  };

  const handleTestLivepayConnection = async () => {
    setTestingLivepay(true);
    setLivepayTestResult(null);
    try {
      const data = await api.get('/admin/livepay/test-balance');
      setLivepayTestResult({ success: true, message: data.message, data: data.balanceData, accountNumber: data.accountNumber });
    } catch (err) {
      setLivepayTestResult({ success: false, error: err.message });
    } finally {
      setTestingLivepay(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('netflix_token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Verify live user role from server
    api.get('/auth/me')
      .then(res => {
        if (res && res.user) {
          localStorage.setItem('netflix_user', JSON.stringify(res.user));
          if (res.user.role !== 'ADMIN') {
            navigate('/browse');
          }
        }
      })
      .catch(() => {});

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

  const filteredUsers = (Array.isArray(userSignups) ? userSignups : []).filter(u =>
    u && u.email && (
      u.email.toLowerCase().includes((userSearchQuery || '').toLowerCase()) ||
      (u.plan || '').toLowerCase().includes((userSearchQuery || '').toLowerCase())
    )
  );

  const NAV_ITEMS = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={18} />, action: () => {} },
    { id: 'signups', label: `Users (${userSignups.length})`, icon: <Users size={18} />, action: fetchUserSignups },
    { id: 'packages', label: 'Packages', icon: <PackageIcon size={18} />, action: fetchPackages },
    { id: 'livepay', label: 'LivePay', icon: <CreditCard size={18} />, action: fetchSettingsAndStats },
    { id: 'apikeys', label: 'API Key', icon: <Key size={18} />, action: fetchSettingsAndStats },
    { id: 'catalog', label: `Catalog (${movies.length})`, icon: <Film size={18} />, action: fetchMovies },
    { id: 'analytics', label: 'Analytics', icon: <Activity size={18} />, action: fetchSettingsAndStats },
  ];

  const PAGE_TITLES = {
    overview: 'System Overview',
    signups: 'User Signups',
    packages: 'Packages & Pricing',
    livepay: 'LivePay Gateway',
    apikeys: 'Reelplexi API Key',
    catalog: 'VJ Media Catalog',
    analytics: 'Content Analytics',
  };

  return (
    <div className="admin-layout">

      {/* SIDEBAR — desktop only */}
      <aside className="admin-sidebar">
        <div>
          <div className="admin-sidebar-brand">
            <img src="/movie-zone-logo.svg" alt="MovieZone" />
            <div className="admin-sidebar-label">Admin Console</div>
          </div>
          <nav className="admin-nav">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                className={`admin-nav-btn ${activeNav === item.id ? 'admin-nav-btn--active' : ''}`}
                onClick={() => { setActiveNav(item.id); item.action(); }}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="admin-sidebar-footer">
          <div className="admin-status-pill">
            <div className="admin-status-dot">Reelplexi CDN Online</div>
            <div className="admin-status-sub">Sub-100ms response</div>
          </div>
          <button className="admin-logout-btn" onClick={() => { localStorage.removeItem('netflix_token'); localStorage.removeItem('netflix_user'); navigate('/login'); }}>
            <LogOut size={15} /> Admin Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <h1 className="admin-topbar-title">{PAGE_TITLES[activeNav]}</h1>
            <p className="admin-topbar-sub">Reelplexi Management Portal • Ugandan VJ Cinema Network</p>
          </div>
          {activeNav === 'catalog' && (
            <button className="admin-topbar-action" onClick={handleOpenIngest}>
              <Plus size={16} /> Ingest Media
            </button>
          )}
          {activeNav === 'packages' && (
            <button className="admin-topbar-action" onClick={() => handleOpenPackageModal()}>
              <Plus size={16} /> New Package
            </button>
          )}
        </div>

        {error && <div style={{ marginBottom: 20, background: '#3d1c1c', border: '1px solid #e50914', color: '#fff', padding: '14px', borderRadius: '8px' }}>{error}</div>}

        {/* SECTION 1: DASHBOARD OVERVIEW */}
        {activeNav === 'overview' && (
          <div>
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-label">Total Users</div>
                <div className="admin-stat-value">{userSignups.length}</div>
                <div className="admin-stat-sub">Registered accounts</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">Reelplexi Key</div>
                <div className="admin-stat-value" style={{ fontSize: '1.1rem', color: reelplexiStats?.api_key_configured ? '#46d369' : '#e50914' }}>
                  {reelplexiStats?.api_key_configured ? 'Active' : 'Demo'}
                </div>
                <div className="admin-stat-sub" style={{ color: '#888' }}>{reelplexiStats?.plan || 'Growth Plan'}</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">API Requests Today</div>
                <div className="admin-stat-value">{reelplexiStats?.requests_today || 1523}</div>
                <div className="admin-stat-sub" style={{ color: '#888' }}>Quota: {reelplexiStats?.requests_limit || 50000}/mo</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">VJ Titles</div>
                <div className="admin-stat-value" style={{ color: '#e50914' }}>{movies.length}</div>
                <div className="admin-stat-sub" style={{ color: '#888' }}>Luganda voiceovers</div>
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
          <div className="admin-table-wrap">
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

        {/* SECTION 6: PACKAGES & PRICING CONFIGURATION */}
        {activeNav === 'packages' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              {packagesList.map((pkg) => (
                <div
                  key={pkg.id}
                  style={{
                    background: '#161820', border: pkg.isActive ? '1px solid rgba(229,9,20,0.4)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px', padding: '24px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0, color: '#fff' }}>{pkg.name}</h3>
                      <span style={{
                        background: pkg.isActive ? 'rgba(70,211,105,0.15)' : 'rgba(255,255,255,0.1)',
                        color: pkg.isActive ? '#46d369' : '#888',
                        padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700'
                      }}>
                        {pkg.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>

                    <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#ff4d4d', marginBottom: '8px' }}>
                      {pkg.price.toLocaleString()} <span style={{ fontSize: '0.9rem', color: '#aaa', fontWeight: '600' }}>{pkg.currency} / {pkg.interval.toLowerCase()}</span>
                    </div>

                    <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '16px', lineHeight: '1.4' }}>
                      {pkg.description || 'Standard subscription access plan.'}
                    </p>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px', marginBottom: '20px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '6px' }}><strong>Resolution:</strong> {pkg.resolution}</div>
                      <div style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '6px' }}><strong>Screens:</strong> {pkg.screens} simultaneous</div>
                      <div style={{ fontSize: '0.8rem', color: '#aaa' }}><strong>Features:</strong> {pkg.features || 'Full movie catalog access'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                    <button
                      onClick={() => handleOpenPackageModal(pkg)}
                      style={{ flex: 1, background: '#222', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeletePackage(pkg.id)}
                      style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#f87171', padding: '10px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 7: LIVEPAY PAYMENT GATEWAY CONFIGURATION */}
        {activeNav === 'livepay' && (
          <div>
            <div style={{ background: '#161820', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '28px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Smartphone size={22} color="#e50914" /> LivePay Mobile Money Gateway Settings
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: livepayEnabled ? '#46d369' : '#888', fontWeight: 'bold' }}>
                    {livepayEnabled ? 'GATEWAY ACTIVE' : 'GATEWAY DISABLED'}
                  </span>
                  <input
                    type="checkbox"
                    checked={livepayEnabled}
                    onChange={(e) => setLivepayEnabled(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#e50914' }}
                  />
                </div>
              </div>

              <p style={{ color: '#aaa', marginBottom: '24px', fontSize: '0.92rem', lineHeight: '1.5' }}>
                Type your <strong>LivePay API Key</strong> and <strong>Account Number</strong> below. When users click pay via Mobile Money during package subscription, funds will be directly requested via <code>https://livepay.me/api/collect-money</code>.
              </p>

              {livepaySaveStatus && (
                <div style={{
                  background: livepaySaveStatus.startsWith('Error') ? '#3d1c1c' : '#1b3d22',
                  border: livepaySaveStatus.startsWith('Error') ? '1px solid #e50914' : '1px solid #46d369',
                  color: '#fff', padding: '14px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  {livepaySaveStatus.startsWith('Error') ? <AlertCircle size={18} color="#e50914" /> : <CheckCircle2 size={18} color="#46d369" />}
                  {livepaySaveStatus}
                </div>
              )}

              <form onSubmit={handleSaveLivepaySettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#ccc', marginBottom: '6px' }}>
                    LIVEPAY API KEY (Authorization Token)
                  </label>
                  <input
                    type="text"
                    placeholder="Paste LivePay Bearer API key..."
                    value={livepayApiKey}
                    onChange={(e) => setLivepayApiKey(e.target.value)}
                    style={{ width: '100%', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.2)', padding: '14px 18px', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#ccc', marginBottom: '6px' }}>
                    LIVEPAY ACCOUNT NUMBER
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LP2305443309"
                    value={livepayAccountNumber}
                    onChange={(e) => setLivepayAccountNumber(e.target.value)}
                    style={{ width: '100%', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.2)', padding: '14px 18px', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={handleTestLivepayConnection}
                    disabled={testingLivepay || !livepayApiKey}
                    style={{ background: '#1f222e', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '14px 24px', borderRadius: '8px', fontWeight: '700', cursor: testingLivepay ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <RefreshCw size={16} className={testingLivepay ? 'spin' : ''} /> {testingLivepay ? 'Testing Authorization...' : '⚡ Test API Key & Check Balance'}
                  </button>

                  <button type="submit" style={{ background: '#e50914', color: '#fff', border: 'none', padding: '14px 32px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(229,9,20,0.4)' }}>
                    <Check size={18} /> Save LivePay Settings
                  </button>
                </div>
              </form>

              {livepayTestResult && (
                <div style={{
                  marginTop: '24px', padding: '18px', borderRadius: '8px',
                  background: livepayTestResult.success ? 'rgba(70,211,105,0.1)' : 'rgba(239,68,68,0.1)',
                  border: livepayTestResult.success ? '1px solid #46d369' : '1px solid #ef4444'
                }}>
                  <div style={{ fontWeight: 'bold', color: livepayTestResult.success ? '#46d369' : '#f87171', marginBottom: '6px', fontSize: '0.95rem' }}>
                    {livepayTestResult.success ? '✅ ' + livepayTestResult.message : '❌ Authorization Test Failed: ' + livepayTestResult.error}
                  </div>
                  {livepayTestResult.data && (
                    <div style={{ fontSize: '0.85rem', color: '#ccc', marginTop: '8px', fontFamily: 'monospace' }}>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(livepayTestResult.data, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Integration Specifications Card */}
            <div style={{ background: '#161820', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '14px', color: '#fff' }}>
                LivePay Collect Money Specification Summary
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.85rem', color: '#aaa' }}>
                <div style={{ background: '#0a0a0c', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <strong style={{ color: '#fff' }}>Endpoint:</strong> <code>https://livepay.me/api/collect-money</code><br />
                  <strong style={{ color: '#fff' }}>Method:</strong> POST<br />
                  <strong style={{ color: '#fff' }}>Auth Header:</strong> Bearer &lt;Your API Key&gt;
                </div>
                <div style={{ background: '#0a0a0c', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <strong style={{ color: '#fff' }}>Configured Account:</strong> {livepayAccountNumber || 'Not Set'}<br />
                  <strong style={{ color: '#fff' }}>Configured API Key:</strong> {livepayApiKey ? '••••••••' + livepayApiKey.slice(-6) : 'Not Set'}<br />
                  <strong style={{ color: '#fff' }}>Status:</strong> {livepayApiKey && livepayAccountNumber ? 'Ready for collections' : 'Awaiting configuration'}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Mobile bottom nav */}
      <nav className="admin-mobile-nav-bar">
        <div className="admin-mobile-nav-inner">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`admin-mobile-nav-tab ${activeNav === item.id ? 'admin-mobile-nav-tab--active' : ''}`}
              onClick={() => { setActiveNav(item.id); item.action(); }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

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

      {/* Package Create/Edit Modal */}
      {showPackageModal && (
        <div className="payment-modal-overlay">
          <div className="profile-modal" style={{ maxWidth: '640px', background: '#12141c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '28px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(229,9,20,0.15)', border: '1px solid #e50914', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PackageIcon size={22} color="#e50914" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0, color: '#fff' }}>
                    {editingPackageId ? 'Edit Package & Pricing' : 'Create Subscription Package'}
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: '#888' }}>Set custom pricing, access duration, and quality limits</span>
                </div>
              </div>
              <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => setShowPackageModal(false)}>
                <X size={20} color="#fff" />
              </button>
            </div>

            {error && <div className="error-message" style={{ marginBottom: '16px', padding: '12px', background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: '8px', color: '#f87171', fontSize: '0.88rem' }}>{error}</div>}

            <form onSubmit={handleSavePackage} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
              <div className="cc-input-container" style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Package Name</label>
                <input type="text" value={pkgName} onChange={(e) => setPkgName(e.target.value)} placeholder="e.g. Daily Pass, Monthly VIP, 12 Hours Special" style={{ background: '#1c1e28', border: '1px solid rgba(255,255,255,0.12)', padding: '12px 14px', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none' }} required />
              </div>

              <div className="cc-input-container">
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price Amount</label>
                <input type="number" value={pkgPrice} onChange={(e) => setPkgPrice(e.target.value)} placeholder="e.g. 2000" style={{ background: '#1c1e28', border: '1px solid rgba(255,255,255,0.12)', padding: '12px 14px', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none' }} required />
              </div>

              <div className="cc-input-container">
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Currency</label>
                <select value={pkgCurrency} onChange={(e) => setPkgCurrency(e.target.value)} style={{ background: '#1c1e28', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', padding: '12px 14px', borderRadius: '8px', fontSize: '0.95rem', outline: 'none', fontWeight: '600' }}>
                  <option value="UGX">UGX (Ugandan Shilling)</option>
                  <option value="USD">USD ($)</option>
                  <option value="KES">KES (Kenyan Shilling)</option>
                </select>
              </div>

              {/* Session Duration Limit (Time value) & Time Unit Side-by-Side (Matching user design request) */}
              <div className="cc-input-container">
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#ccc', marginBottom: '6px' }}>
                  Session Duration Limit (Time value)
                </label>
                <input
                  type="number"
                  min="0"
                  value={pkgDurationVal}
                  onChange={(e) => setPkgDurationVal(e.target.value)}
                  placeholder="0"
                  style={{ background: '#1c1e28', border: '1px solid rgba(255,255,255,0.2)', padding: '12px 14px', borderRadius: '8px', color: '#fff', fontSize: '1rem', outline: 'none', width: '100%' }}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px', display: 'block' }}>
                  Use 0 for unlimited time.
                </span>
              </div>

              <div className="cc-input-container">
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#ccc', marginBottom: '6px' }}>
                  Time Unit
                </label>
                <select
                  value={pkgDurationUnit}
                  onChange={(e) => setPkgDurationUnit(e.target.value)}
                  style={{ background: '#1c1e28', border: '1.5px solid #3b82f6', color: '#fff', padding: '12px 14px', borderRadius: '8px', fontSize: '1rem', width: '100%', outline: 'none', fontWeight: '700', cursor: 'pointer' }}
                >
                  <option value="MINUTES">Minutes</option>
                  <option value="HOURS">Hours</option>
                  <option value="DAYS">Days</option>
                  <option value="WEEKS">Weeks</option>
                  <option value="MONTHS">Months</option>
                  <option value="YEARS">Years</option>
                </select>
              </div>

              {/* Summary Duration Badge */}
              <div style={{ gridColumn: 'span 2', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', padding: '10px 14px', color: '#60a5fa', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="#60a5fa" />
                <span>
                  Configured Pass Duration: <strong style={{ color: '#fff' }}>{pkgDurationVal == 0 ? 'Unlimited Access (No Expiration)' : `${pkgDurationVal} ${pkgDurationUnit.toLowerCase()}`}</strong>
                </span>
              </div>

              <div className="cc-input-container">
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Resolution Quality</label>
                <select value={pkgResolution} onChange={(e) => setPkgResolution(e.target.value)} style={{ background: '#1c1e28', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', padding: '12px 14px', borderRadius: '8px', fontSize: '0.95rem', outline: 'none' }}>
                  <option value="720p HD">720p HD</option>
                  <option value="1080p Full HD">1080p Full HD</option>
                  <option value="4K Ultra HD">4K Ultra HD</option>
                </select>
              </div>

              <div className="cc-input-container">
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Simultaneous Screens</label>
                <input type="number" value={pkgScreens} onChange={(e) => setPkgScreens(e.target.value)} min="1" max="10" style={{ background: '#1c1e28', border: '1px solid rgba(255,255,255,0.12)', padding: '12px 14px', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none' }} required />
              </div>

              <div className="cc-input-container" style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Short Description</label>
                <input type="text" placeholder="Full access to all Luganda translated movies and series" value={pkgDescription} onChange={(e) => setPkgDescription(e.target.value)} style={{ background: '#1c1e28', border: '1px solid rgba(255,255,255,0.12)', padding: '12px 14px', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none' }} />
              </div>

              <div className="cc-input-container" style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Feature Bullet Points (Comma separated)</label>
                <input type="text" placeholder="Unlimited Streaming, HD Quality, All VJ Downloads" value={pkgFeatures} onChange={(e) => setPkgFeatures(e.target.value)} style={{ background: '#1c1e28', border: '1px solid rgba(255,255,255,0.12)', padding: '12px 14px', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none' }} />
              </div>

              <div style={{ gridColumn: 'span 2', background: '#1c1e28', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label htmlFor="isActiveCheck" style={{ cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={16} color={pkgIsActive ? '#46d369' : '#888'} /> Active & Visible on Checkout Page
                </label>
                <input type="checkbox" id="isActiveCheck" checked={pkgIsActive} onChange={(e) => setPkgIsActive(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#e50914' }} />
              </div>

              <div className="payment-actions" style={{ gridColumn: 'span 2', marginTop: '12px', display: 'flex', gap: '12px' }}>
                <button type="button" className="payment-cancel" onClick={() => setShowPackageModal(false)} style={{ flex: 1, background: '#222', border: '1px solid rgba(255,255,255,0.1)', color: '#ccc', padding: '14px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" className="payment-confirm" disabled={loading} style={{ flex: 2, background: '#e50914', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 15px rgba(229,9,20,0.4)' }}>
                  {loading ? 'Saving...' : (editingPackageId ? 'Update Package' : 'Create Package')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
