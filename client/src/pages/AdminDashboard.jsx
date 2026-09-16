import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, X, Edit, Trash2, Users, Key, Film, Activity,
  LogOut, BarChart3, Search, RefreshCw, CheckCircle2,
  AlertCircle, Clock, Package as PackageIcon, Check,
  CreditCard, Smartphone, ShieldCheck, TrendingUp
} from 'lucide-react';
import { api } from '../utils/api';

export default function AdminDashboard() {
  const [activeNav, setActiveNav] = useState('overview');
  const [movies, setMovies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMovieId, setEditingMovieId] = useState(null);
  const [packagesList, setPackagesList] = useState([]);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState(null);
  const [pkgName, setPkgName] = useState('');
  const [pkgPrice, setPkgPrice] = useState('');
  const [pkgCurrency, setPkgCurrency] = useState('UGX');
  const [pkgDurationVal, setPkgDurationVal] = useState(30);
  const [pkgDurationUnit, setPkgDurationUnit] = useState('DAYS');
  const [pkgDescription, setPkgDescription] = useState('');
  const [pkgFeatures, setPkgFeatures] = useState('');
  const [pkgResolution, setPkgResolution] = useState('1080p Full HD');
  const [pkgScreens, setPkgScreens] = useState(2);
  const [pkgIsActive, setPkgIsActive] = useState(true);
  const [userSignups, setUserSignups] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [reelplexiStats, setReelplexiStats] = useState(null);
  const [reelplexiActivity, setReelplexiActivity] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  const [livepayApiKey, setLivepayApiKey] = useState('');
  const [livepayAccountNumber, setLivepayAccountNumber] = useState('');
  const [livepayWebhookSecret, setLivepayWebhookSecret] = useState('');
  const [livepayEnabled, setLivepayEnabled] = useState(true);
  const [livepaySaveStatus, setLivepaySaveStatus] = useState('');
  const [livepayTestResult, setLivepayTestResult] = useState(null);
  const [testingLivepay, setTestingLivepay] = useState(false);
  const [catalogStats, setCatalogStats] = useState(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [txStats, setTxStats] = useState({ totalRevenue: 0, successCount: 0, pendingCount: 0, failedCount: 0, totalCount: 0 });
  const [txFilterStatus, setTxFilterStatus] = useState('ALL');
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [txLoading, setTxLoading] = useState(false);
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

  const parseInterval = (str) => {
    if (!str) return { val: 1, unit: 'MONTHS' };
    const s = String(str).toUpperCase().trim();
    const m = s.match(/^(\d+)[_\s:]*([A-Z]+)$/);
    if (m) {
      let u = m[2];
      if (u.startsWith('MIN')) u = 'MINUTES';
      else if (u.startsWith('HOUR')) u = 'HOURS';
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

  const fetchPackages = async () => {
    try { const d = await api.get('/admin/packages'); setPackagesList(Array.isArray(d) ? d : []); } catch { setPackagesList([]); }
  };
  const fetchMovies = async () => {
    try {
      const d = await api.get('/admin/movies');
      if (Array.isArray(d)) {
        setMovies(d);
      } else if (d && d.movies) {
        setMovies(d.movies);
        if (d.stats) setCatalogStats(d.stats);
      }
    } catch { setMovies([]); }
  };
  const fetchUserSignups = async () => {
    setUsersLoading(true);
    try { const d = await api.get('/admin/users'); setUserSignups(Array.isArray(d) ? d : []); } catch { setUserSignups([]); } finally { setUsersLoading(false); }
  };
  const fetchTransactions = async (statusFilter = txFilterStatus) => {
    setTxLoading(true);
    try {
      const res = await api.get(`/admin/transactions?status=${statusFilter}`);
      setTransactions(res.transactions || []);
      if (res.stats) setTxStats(res.stats);
    } catch {
      setTransactions([]);
    } finally {
      setTxLoading(false);
    }
  };
  const handleUpdateTxStatus = async (txId, newStatus) => {
    try {
      await api.put(`/admin/transactions/${txId}/status`, { status: newStatus });
      fetchTransactions(txFilterStatus);
      fetchUserSignups();
    } catch (err) {
      alert(err.message || 'Failed to update transaction status');
    }
  };
  const fetchSettingsAndStats = async () => {
    try {
      const s = await api.get('/admin/settings');
      if (s?.REELPLEXI_API_KEY) setApiKey(s.REELPLEXI_API_KEY);
      if (s?.settings?.LIVEPAY_API_KEY) setLivepayApiKey(s.settings.LIVEPAY_API_KEY);
      if (s?.settings?.LIVEPAY_ACCOUNT_NUMBER) setLivepayAccountNumber(s.settings.LIVEPAY_ACCOUNT_NUMBER);
      if (s?.settings?.LIVEPAY_WEBHOOK_SECRET) setLivepayWebhookSecret(s.settings.LIVEPAY_WEBHOOK_SECRET);
      if (s?.settings?.LIVEPAY_ENABLED !== undefined) setLivepayEnabled(s.settings.LIVEPAY_ENABLED !== 'false');
    } catch {}
    try { const d = await api.get('/admin/reelplexi/stats'); setReelplexiStats(d); } catch {}
    try { const d = await api.get('/admin/reelplexi/activity?limit=10'); setReelplexiActivity(Array.isArray(d) ? d : []); } catch { setReelplexiActivity([]); }
    try { const d = await api.get('/admin/reelplexi/top-movies'); setTopMovies(Array.isArray(d) ? d : []); } catch { setTopMovies([]); }
  };

  useEffect(() => {
    const token = localStorage.getItem('netflix_token');
    if (!token) { navigate('/login'); return; }
    api.get('/auth/me').then(res => {
      if (res?.user) {
        localStorage.setItem('netflix_user', JSON.stringify(res.user));
        if (res.user.role !== 'ADMIN') navigate('/browse');
      }
    }).catch(() => {});
    fetchMovies(); fetchUserSignups(); fetchPackages(); fetchTransactions(); fetchSettingsAndStats();
  }, [navigate]);

  const handleSaveApiKey = async (e) => {
    e.preventDefault(); setSaveStatus('');
    const val = (apiKey || '').trim();
    if (val.startsWith('http')) { setSaveStatus('Error: Enter API key, not a URL.'); return; }
    try { await api.post('/admin/settings', { key: 'REELPLEXI_API_KEY', value: val }); setSaveStatus('API Key saved!'); fetchSettingsAndStats(); }
    catch (err) { setSaveStatus('Error: ' + err.message); }
  };

  const handleSaveLivepaySettings = async (e) => {
    e.preventDefault(); setLivepaySaveStatus('');
    try {
      await api.post('/admin/settings', { settings: { LIVEPAY_API_KEY: livepayApiKey.trim(), LIVEPAY_ACCOUNT_NUMBER: livepayAccountNumber.trim(), LIVEPAY_WEBHOOK_SECRET: livepayWebhookSecret.trim(), LIVEPAY_ENABLED: livepayEnabled ? 'true' : 'false' } });
      setLivepaySaveStatus('LivePay settings & Webhook Secret saved!');
    } catch (err) { setLivepaySaveStatus('Error: ' + err.message); }
  };

  const handleTestLivepayConnection = async () => {
    setTestingLivepay(true); setLivepayTestResult(null);
    try { const d = await api.get('/admin/livepay/test-balance'); setLivepayTestResult({ success: true, message: d.message, data: d.balanceData }); }
    catch (err) { setLivepayTestResult({ success: false, error: err.message }); }
    finally { setTestingLivepay(false); }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user account?')) return;
    try { await api.delete(`/admin/users/${userId}`); fetchUserSignups(); }
    catch (err) { alert(err.message || 'Failed'); }
  };

  const handleOpenPackageModal = (pkg = null) => {
    setError('');
    if (pkg) {
      setEditingPackageId(pkg.id); setPkgName(pkg.name); setPkgPrice(pkg.price);
      setPkgCurrency(pkg.currency || 'UGX');
      const p = parseInterval(pkg.interval); setPkgDurationVal(p.val); setPkgDurationUnit(p.unit);
      setPkgDescription(pkg.description || ''); setPkgFeatures(pkg.features || '');
      setPkgResolution(pkg.resolution || '1080p Full HD'); setPkgScreens(pkg.screens || 2);
      setPkgIsActive(pkg.isActive !== undefined ? pkg.isActive : true);
    } else {
      setEditingPackageId(null); setPkgName(''); setPkgPrice(''); setPkgCurrency('UGX');
      setPkgDurationVal(30); setPkgDurationUnit('DAYS'); setPkgDescription(''); setPkgFeatures('');
      setPkgResolution('1080p Full HD'); setPkgScreens(2); setPkgIsActive(true);
    }
    setShowPackageModal(true);
  };

  const handleSavePackage = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    const payload = { name: pkgName, price: parseFloat(pkgPrice), currency: pkgCurrency, interval: `${parseInt(pkgDurationVal,10)}_${pkgDurationUnit}`, description: pkgDescription, features: pkgFeatures, resolution: pkgResolution, screens: parseInt(pkgScreens,10), isActive: pkgIsActive };
    try {
      if (editingPackageId) await api.put(`/admin/packages/${editingPackageId}`, payload);
      else await api.post('/admin/packages', payload);
      await fetchPackages(); setShowPackageModal(false);
    } catch (err) { setError(err.message || 'Error saving package'); }
    finally { setLoading(false); }
  };

  const handleDeletePackage = async (id) => {
    if (!window.confirm('Delete this package?')) return;
    try { await api.delete(`/admin/packages/${id}`); await fetchPackages(); }
    catch (err) { setError(err.message || 'Error deleting package'); }
  };

  const handleOpenIngest = () => {
    setEditingMovieId(null); setTitle(''); setDescription(''); setThumbnailUrl(''); setBackdropUrl('');
    setVideoUrl(''); setTmdbId(''); setDuration(''); setReleaseYear(new Date().getFullYear().toString());
    setRating('PG-13'); setGenres(''); setType('MOVIE'); setCategory('UG VJ Exclusives');
    setVj('VJ Junior'); setOriginCountry('UG'); setRegion('east-african'); setError(''); setShowModal(true);
  };

  const handleOpenEdit = (movie) => {
    setEditingMovieId(movie.id); setTitle(movie.title); setDescription(movie.description);
    setThumbnailUrl(movie.thumbnailUrl); setBackdropUrl(movie.backdropUrl); setVideoUrl(movie.videoUrl);
    setTmdbId(movie.tmdbId || ''); setDuration(movie.duration); setReleaseYear(movie.releaseYear.toString());
    setRating(movie.rating); setGenres(movie.genres); setType(movie.type); setCategory(movie.category);
    setVj(movie.vj || 'VJ Junior'); setOriginCountry(movie.originCountry || 'UG'); setRegion(movie.region || 'east-african');
    setError(''); setShowModal(true);
  };

  const handleSaveMovie = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    const payload = { title, description, thumbnailUrl, backdropUrl, videoUrl, tmdbId, duration: duration || (type === 'MOVIE' ? '2h' : '1 Season'), releaseYear: parseInt(releaseYear,10), rating, genres, type, category, vj, originCountry, region };
    try {
      if (editingMovieId) await api.put(`/admin/movies/${editingMovieId}`, payload);
      else await api.post('/admin/movies', payload);
      await fetchMovies(); setShowModal(false);
    } catch (err) { setError(err.message || 'Error saving movie'); }
    finally { setLoading(false); }
  };

  const handleDeleteMovie = async (id) => {
    if (!window.confirm('Delete this title? This is irreversible.')) return;
    try { await api.delete(`/admin/movies/${id}`); await fetchMovies(); }
    catch (err) { setError(err.message || 'Error deleting movie'); }
  };

  const filteredUsers = (Array.isArray(userSignups) ? userSignups : []).filter(u =>
    u?.name?.toLowerCase().includes((userSearchQuery || '').toLowerCase()) ||
    u?.email?.toLowerCase().includes((userSearchQuery || '').toLowerCase()) ||
    (u?.plan || '').toLowerCase().includes((userSearchQuery || '').toLowerCase())
  );

  const activeUsers = userSignups.filter(u => u.subscriptionStatus === 'ACTIVE').length;

  const filteredCatalogMovies = movies.filter(m => {
    if (!catalogSearch.trim()) return true;
    const q = catalogSearch.toLowerCase();
    return (
      (m.title && m.title.toLowerCase().includes(q)) ||
      (m.vj && m.vj.toLowerCase().includes(q)) ||
      (m.category && m.category.toLowerCase().includes(q))
    );
  });

  const filteredTransactions = transactions.filter(tx => {
    if (!txSearchQuery.trim()) return true;
    const q = txSearchQuery.toLowerCase();
    return (
      (tx.email && tx.email.toLowerCase().includes(q)) ||
      (tx.phoneNumber && tx.phoneNumber.toLowerCase().includes(q)) ||
      (tx.reference && tx.reference.toLowerCase().includes(q)) ||
      (tx.packageName && tx.packageName.toLowerCase().includes(q))
    );
  });

  const NAV_ITEMS = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
    { id: 'signups', label: 'Users', icon: <Users size={16} />, badge: userSignups.length },
    { id: 'payments', label: 'Payments', icon: <CreditCard size={16} />, badge: txStats?.pendingCount > 0 ? txStats.pendingCount : undefined },
    { id: 'packages', label: 'Packages', icon: <PackageIcon size={16} />, badge: packagesList.length },
    { id: 'catalog', label: 'Catalog', icon: <Film size={16} />, badge: catalogStats?.reelplexiTotalContent || movies.length },
    { id: 'livepay', label: 'LivePay', icon: <CreditCard size={16} /> },
    { id: 'apikeys', label: 'API Key', icon: <Key size={16} /> },
    { id: 'analytics', label: 'Analytics', icon: <Activity size={16} /> },
  ];

  const PAGE_TITLES = { overview: 'Overview', signups: 'Users', payments: 'Payments & Transactions Tracker', packages: 'Packages', livepay: 'LivePay', apikeys: 'API Key', catalog: 'Catalog', analytics: 'Analytics' };

  const inp = { background: '#0f1117', border: '1px solid rgba(255,255,255,0.1)', padding: '11px 14px', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', outline: 'none', width: '100%' };
  const sel = { ...inp, cursor: 'pointer' };
  const lbl = { display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' };

  return (
    <div className="ad-root">

      {/* SIDEBAR */}
      <aside className="ad-sidebar">
        <div className="ad-sidebar-top">
          <div className="ad-brand">
            <img src="/movie-zone-logo.svg" alt="MovieZone" className="ad-brand-logo" />
            <span className="ad-brand-tag">Admin Console</span>
          </div>
          <nav className="ad-nav">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                className={`ad-nav-btn ${activeNav === item.id ? 'ad-nav-btn--active' : ''}`}
                onClick={() => {
                  setActiveNav(item.id);
                  if (item.id === 'signups') fetchUserSignups();
                  if (item.id === 'payments') fetchTransactions();
                  if (item.id === 'packages') fetchPackages();
                  if (item.id === 'catalog') fetchMovies();
                  if (['apikeys','livepay','analytics'].includes(item.id)) fetchSettingsAndStats();
                }}
              >
                <span className="ad-nav-icon">{item.icon}</span>
                <span className="ad-nav-label">{item.label}</span>
                {item.badge !== undefined && <span className="ad-nav-badge">{item.badge}</span>}
              </button>
            ))}
          </nav>
        </div>
        <div className="ad-sidebar-bottom">
          <div className="ad-cdn-status">
            <span className="ad-cdn-dot" />
            <div>
              <div className="ad-cdn-label">Reelplexi CDN</div>
              <div className="ad-cdn-sub">Online · sub-100ms</div>
            </div>
          </div>
          <button className="ad-logout-btn" onClick={() => { localStorage.removeItem('netflix_token'); localStorage.removeItem('netflix_user'); navigate('/login'); }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="ad-main">

        {/* TOPBAR */}
        <header className="ad-topbar">
          <div>
            <h1 className="ad-topbar-title">{PAGE_TITLES[activeNav]}</h1>
            <p className="ad-topbar-sub">Vicotech Digital · MovieZone Management Portal</p>
          </div>
          <div className="ad-topbar-actions">
            {activeNav === 'catalog' && (
              <button className="ad-action-btn" onClick={handleOpenIngest}><Plus size={15} /> Add Movie</button>
            )}
            {activeNav === 'packages' && (
              <button className="ad-action-btn" onClick={() => handleOpenPackageModal()}><Plus size={15} /> New Package</button>
            )}
          </div>
        </header>

        <div className="ad-content">
          {error && <div className="ad-alert ad-alert--error"><AlertCircle size={16} />{error}</div>}

          {/* ── OVERVIEW ── */}
          {activeNav === 'overview' && (
            <div className="ad-section">
              <div className="ad-stats-row">
                <div className="ad-stat"><div className="ad-stat-icon" style={{background:'rgba(229,9,20,0.15)'}}><Users size={20} color="#e50914"/></div><div><div className="ad-stat-val">{userSignups.length}</div><div className="ad-stat-lbl">Total Users</div></div></div>
                <div className="ad-stat"><div className="ad-stat-icon" style={{background:'rgba(70,211,105,0.15)'}}><ShieldCheck size={20} color="#46d369"/></div><div><div className="ad-stat-val" style={{color:'#46d369'}}>{activeUsers}</div><div className="ad-stat-lbl">Active Subs</div></div></div>
                <div className="ad-stat"><div className="ad-stat-icon" style={{background:'rgba(99,102,241,0.15)'}}><Film size={20} color="#818cf8"/></div><div><div className="ad-stat-val" style={{color:'#818cf8'}}>{(catalogStats?.reelplexiTotalContent || movies.length).toLocaleString()}</div><div className="ad-stat-lbl">Live Catalog Titles</div></div></div>
                <div className="ad-stat"><div className="ad-stat-icon" style={{background:'rgba(251,191,36,0.15)'}}><PackageIcon size={20} color="#fbbf24"/></div><div><div className="ad-stat-val" style={{color:'#fbbf24'}}>{packagesList.length}</div><div className="ad-stat-lbl">Packages</div></div></div>
              </div>

              <div className="ad-two-col">
                <div className="ad-card">
                  <div className="ad-card-header"><Users size={16} color="#e50914"/> Recent Signups</div>
                  <table className="ad-table">
                    <thead><tr><th>Name</th><th>Email</th><th>Package</th><th>Status</th><th>Joined</th></tr></thead>
                    <tbody>
                      {userSignups.slice(0,6).map(u => (
                        <tr key={u.id}>
                          <td style={{fontWeight:600}}>{u.name || '—'}</td>
                          <td>{u.email}</td>
                          <td><span className="ad-pkg-badge">{u.plan !== 'NONE' ? u.plan : '—'}</span></td>
                          <td><span className={`ad-status-badge ${u.subscriptionStatus === 'ACTIVE' ? 'ad-status-badge--active' : ''}`}>{u.subscriptionStatus}</span></td>
                          <td className="ad-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="ad-card">
                  <div className="ad-card-header"><TrendingUp size={16} color="#e50914"/> Quick Actions</div>
                  <div style={{display:'flex',flexDirection:'column',gap:'10px',marginTop:'4px'}}>
                    {[['signups','Manage Users',<Users size={14}/>],['payments','Track Payments & Revenue',<CreditCard size={14}/>],['packages','Manage Packages',<PackageIcon size={14}/>],['catalog','Add Content',<Film size={14}/>],['livepay','Configure LivePay',<CreditCard size={14}/>]].map(([id,label,icon])=>(
                      <button key={id} className="ad-quick-btn" onClick={()=>{ setActiveNav(id); if(id==='payments')fetchTransactions(); }}>{icon}{label} →</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── USERS ── */}
          {activeNav === 'signups' && (
            <div className="ad-section">
              <div className="ad-toolbar">
                <div className="ad-search-wrap">
                  <Search size={15} className="ad-search-icon"/>
                  <input className="ad-search-input" placeholder="Search by email or package..." value={userSearchQuery} onChange={e=>setUserSearchQuery(e.target.value)}/>
                </div>
                <button className="ad-ghost-btn" onClick={fetchUserSignups}><RefreshCw size={14}/> Refresh</button>
              </div>
              {usersLoading ? <div className="ad-loading">Loading users...</div> : (
                <div className="ad-table-wrap">
                  <table className="ad-table">
                    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Package</th><th>Status</th><th>Expires</th><th>Joined</th><th>Actions</th></tr></thead>
                    <tbody>
                      {filteredUsers.map(user => (
                        <tr key={user.id}>
                          <td style={{fontWeight:600}}>{user.name || '—'}</td>
                          <td>{user.email}</td>
                          <td><span className={`ad-role-badge ${user.role === 'ADMIN' ? 'ad-role-badge--admin' : ''}`}>{user.role}</span></td>
                          <td><span className="ad-pkg-badge">{user.plan && user.plan !== 'NONE' ? user.plan : '— None'}</span></td>
                          <td><span className={`ad-status-badge ${user.subscriptionStatus === 'ACTIVE' ? 'ad-status-badge--active' : ''}`}>{user.subscriptionStatus}</span></td>
                          <td className="ad-muted" style={{fontSize:'0.78rem'}}>
                            {user.subscriptionEnd
                              ? new Date(user.subscriptionEnd) < new Date()
                                ? <span style={{color:'#e50914'}}>Expired</span>
                                : new Date(user.subscriptionEnd).toLocaleString()
                              : '—'}
                          </td>
                          <td className="ad-muted">{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td>
                            <div className="ad-row-actions">
                              <select defaultValue="" className="ad-assign-select"
                                onChange={async e => {
                                  const pkgId = e.target.value; if (!pkgId) return;
                                  try { await api.put(`/admin/users/${user.id}/subscription`,{packageId:pkgId,action:'assign'}); fetchUserSignups(); }
                                  catch(err){ alert(err.message||'Failed'); }
                                  e.target.value='';
                                }}>
                                <option value="">Assign Package</option>
                                {packagesList.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                              {user.subscriptionStatus === 'ACTIVE' && (
                                <button className="ad-btn-warn" onClick={async()=>{
                                  if(!window.confirm(`Remove subscription from ${user.email}?`)) return;
                                  try{ await api.put(`/admin/users/${user.id}/subscription`,{action:'remove'}); fetchUserSignups(); }
                                  catch(err){ alert(err.message||'Failed'); }
                                }}>Remove</button>
                              )}
                              <button className="ad-btn-danger-icon" onClick={()=>handleDeleteUser(user.id)}><Trash2 size={13}/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && <tr><td colSpan="8" className="ad-empty">No users found.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── PAYMENTS / TRANSACTIONS ── */}
          {activeNav === 'payments' && (
            <div className="ad-section">
              <div className="ad-stats-row">
                <div className="ad-stat">
                  <div className="ad-stat-icon" style={{ background: 'rgba(70,211,105,0.15)' }}>
                    <TrendingUp size={20} color="#46d369" />
                  </div>
                  <div>
                    <div className="ad-stat-val" style={{ color: '#46d369' }}>
                      UGX {txStats.totalRevenue.toLocaleString()}
                    </div>
                    <div className="ad-stat-lbl">Total Revenue</div>
                  </div>
                </div>

                <div className="ad-stat">
                  <div className="ad-stat-icon" style={{ background: 'rgba(70,211,105,0.15)' }}>
                    <CheckCircle2 size={20} color="#46d369" />
                  </div>
                  <div>
                    <div className="ad-stat-val" style={{ color: '#46d369' }}>{txStats.successCount}</div>
                    <div className="ad-stat-lbl">Successful Payments</div>
                  </div>
                </div>

                <div className="ad-stat">
                  <div className="ad-stat-icon" style={{ background: 'rgba(251,191,36,0.15)' }}>
                    <Clock size={20} color="#fbbf24" />
                  </div>
                  <div>
                    <div className="ad-stat-val" style={{ color: '#fbbf24' }}>
                      {txStats.pendingCount}
                      {txStats.pendingCount > 0 && <span style={{ fontSize: '0.65rem', marginLeft: '6px', background: '#fbbf24', color: '#000', padding: '2px 6px', borderRadius: '10px', fontWeight: 800 }}>PENDING</span>}
                    </div>
                    <div className="ad-stat-lbl">Pending Confirmation</div>
                  </div>
                </div>

                <div className="ad-stat">
                  <div className="ad-stat-icon" style={{ background: 'rgba(229,9,20,0.15)' }}>
                    <AlertCircle size={20} color="#e50914" />
                  </div>
                  <div>
                    <div className="ad-stat-val" style={{ color: '#e50914' }}>{txStats.failedCount}</div>
                    <div className="ad-stat-lbl">Failed Payments</div>
                  </div>
                </div>
              </div>

              <div className="ad-toolbar" style={{ flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['ALL', 'PENDING', 'SUCCESS', 'FAILED'].map(st => (
                    <button
                      key={st}
                      className="ad-ghost-btn"
                      style={{
                        background: txFilterStatus === st ? '#e50914' : 'rgba(255,255,255,0.06)',
                        color: '#fff',
                        borderColor: txFilterStatus === st ? '#e50914' : 'transparent',
                        fontWeight: txFilterStatus === st ? '700' : '500'
                      }}
                      onClick={() => {
                        setTxFilterStatus(st);
                        fetchTransactions(st);
                      }}
                    >
                      {st === 'ALL' ? 'All Payments' : st}
                      {st === 'PENDING' && txStats.pendingCount > 0 && ` (${txStats.pendingCount})`}
                    </button>
                  ))}
                </div>

                <div className="ad-search-wrap" style={{ flex: 1, minWidth: '220px' }}>
                  <Search size={15} className="ad-search-icon" />
                  <input
                    className="ad-search-input"
                    placeholder="Search by email, phone, or reference..."
                    value={txSearchQuery}
                    onChange={e => setTxSearchQuery(e.target.value)}
                  />
                </div>

                <button className="ad-ghost-btn" onClick={() => fetchTransactions(txFilterStatus)}>
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>

              {txLoading ? (
                <div className="ad-loading">Loading payment history...</div>
              ) : (
                <div className="ad-table-wrap">
                  <table className="ad-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>User Email / Phone</th>
                        <th>Package</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Reference</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map(tx => {
                        const isPending = tx.status === 'PENDING';
                        const isSuccess = tx.status === 'SUCCESS';
                        const isFailed = tx.status === 'FAILED';

                        return (
                          <tr key={tx.id} style={{ background: isPending ? 'rgba(251, 191, 36, 0.04)' : 'transparent' }}>
                            <td className="ad-muted" style={{ fontSize: '0.8rem' }}>
                              {new Date(tx.createdAt).toLocaleString()}
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{tx.email}</div>
                              {tx.phoneNumber && (
                                <div style={{ fontSize: '0.78rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Smartphone size={11} /> +256 {tx.phoneNumber}
                                </div>
                              )}
                            </td>
                            <td><span className="ad-pkg-badge">{tx.packageName}</span></td>
                            <td style={{ fontWeight: 700, color: '#fff' }}>
                              {tx.amount?.toLocaleString()} <span style={{ fontSize: '0.75rem', color: '#888' }}>{tx.currency}</span>
                            </td>
                            <td>
                              <span className="ad-pkg-badge" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                {tx.paymentMethod === 'mobile_money' ? '📱 Mobile Money' : '💳 Card'}
                              </span>
                            </td>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#aaa' }}>
                              <div>{tx.reference}</div>
                              {tx.livepayRef && <div style={{ color: '#46d369', fontSize: '0.7rem' }}>Ref: {tx.livepayRef}</div>}
                              {tx.errorMessage && <div style={{ color: '#e50914', fontSize: '0.7rem' }}>{tx.errorMessage}</div>}
                            </td>
                            <td>
                              <span className={`ad-status-badge ${isSuccess ? 'ad-status-badge--active' : ''}`} style={{
                                background: isPending ? 'rgba(251,191,36,0.15)' : isFailed ? 'rgba(229,9,20,0.15)' : 'rgba(70,211,105,0.15)',
                                color: isPending ? '#fbbf24' : isFailed ? '#e50914' : '#46d369',
                                border: `1px solid ${isPending ? '#fbbf24' : isFailed ? '#e50914' : '#46d369'}`
                              }}>
                                {isPending ? '⏳ PENDING' : isSuccess ? '✅ SUCCESS' : '❌ FAILED'}
                              </span>
                            </td>
                            <td>
                              <div className="ad-row-actions">
                                {isPending ? (
                                  <>
                                    <button
                                      className="ad-action-btn"
                                      style={{ background: '#46d369', padding: '6px 12px', fontSize: '0.78rem' }}
                                      onClick={() => {
                                        if (window.confirm(`Confirm & Approve payment of ${tx.amount} ${tx.currency} from ${tx.email}? This will activate premium access for the user.`)) {
                                          handleUpdateTxStatus(tx.id, 'SUCCESS');
                                        }
                                      }}
                                    >
                                      Approve
                                    </button>
                                    <button
                                      className="ad-btn-danger-icon"
                                      style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                                      onClick={() => {
                                        if (window.confirm(`Mark transaction from ${tx.email} as FAILED?`)) {
                                          handleUpdateTxStatus(tx.id, 'FAILED');
                                        }
                                      }}
                                    >
                                      Reject
                                    </button>
                                  </>
                                ) : isFailed ? (
                                  <button
                                    className="ad-ghost-btn"
                                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                                    onClick={() => handleUpdateTxStatus(tx.id, 'SUCCESS')}
                                  >
                                    Approve
                                  </button>
                                ) : (
                                  <button
                                    className="ad-ghost-btn"
                                    style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#e50914' }}
                                    onClick={() => handleUpdateTxStatus(tx.id, 'FAILED')}
                                  >
                                    Reject
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredTransactions.length === 0 && (
                        <tr>
                          <td colSpan="8" className="ad-empty">No payment transactions found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── PACKAGES ── */}
          {activeNav === 'packages' && (
            <div className="ad-section">
              <div className="ad-packages-grid">
                {packagesList.map(pkg => (
                  <div key={pkg.id} className={`ad-pkg-card ${pkg.isActive ? 'ad-pkg-card--active' : ''}`}>
                    <div className="ad-pkg-card-top">
                      <div>
                        <div className="ad-pkg-card-name">{pkg.name}</div>
                        <div className="ad-pkg-card-interval">{pkg.interval?.toLowerCase().replace('_',' ')}</div>
                      </div>
                      <span className={`ad-status-badge ${pkg.isActive ? 'ad-status-badge--active' : ''}`}>{pkg.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                    </div>
                    <div className="ad-pkg-card-price">{pkg.price?.toLocaleString()} <span>{pkg.currency}</span></div>
                    <p className="ad-pkg-card-desc">{pkg.description || 'Standard access plan.'}</p>
                    <div className="ad-pkg-card-specs">
                      <span>📺 {pkg.resolution}</span>
                      <span>🖥 {pkg.screens} screen{pkg.screens !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="ad-pkg-card-actions">
                      <button className="ad-ghost-btn" onClick={()=>handleOpenPackageModal(pkg)}><Edit size={13}/> Edit</button>
                      <button className="ad-btn-danger-icon" onClick={()=>handleDeletePackage(pkg.id)}><Trash2 size={13}/></button>
                    </div>
                  </div>
                ))}
                {packagesList.length === 0 && <div className="ad-empty" style={{gridColumn:'1/-1'}}>No packages yet. Click "New Package" to create one.</div>}
              </div>
            </div>
          )}

          {/* ── CATALOG ── */}
          {activeNav === 'catalog' && (
            <div className="ad-section">
              {/* Live Catalog Metrics Header */}
              <div className="ad-stats-row" style={{marginBottom:'20px'}}>
                <div className="ad-stat">
                  <div className="ad-stat-icon" style={{background:'rgba(229,9,20,0.15)'}}><Film size={20} color="#e50914"/></div>
                  <div>
                    <div className="ad-stat-val">{(catalogStats?.reelplexiMoviesTotal || 4541).toLocaleString()}</div>
                    <div className="ad-stat-lbl">Live Movies (ReelPlexi)</div>
                  </div>
                </div>
                <div className="ad-stat">
                  <div className="ad-stat-icon" style={{background:'rgba(99,102,241,0.15)'}}><Activity size={20} color="#818cf8"/></div>
                  <div>
                    <div className="ad-stat-val" style={{color:'#818cf8'}}>{(catalogStats?.reelplexiSeriesTotal || 1185).toLocaleString()}</div>
                    <div className="ad-stat-lbl">Live TV Series</div>
                  </div>
                </div>
                <div className="ad-stat">
                  <div className="ad-stat-icon" style={{background:'rgba(70,211,105,0.15)'}}><CheckCircle2 size={20} color="#46d369"/></div>
                  <div>
                    <div className="ad-stat-val" style={{color:'#46d369'}}>{(catalogStats?.reelplexiTotalContent || 5726).toLocaleString()}</div>
                    <div className="ad-stat-lbl">Total Live Content</div>
                  </div>
                </div>
                <div className="ad-stat">
                  <div className="ad-stat-icon" style={{background:'rgba(251,191,36,0.15)'}}><PackageIcon size={20} color="#fbbf24"/></div>
                  <div>
                    <div className="ad-stat-val" style={{color:'#fbbf24'}}>{movies.length.toLocaleString()}</div>
                    <div className="ad-stat-lbl">Active Loaded Items</div>
                  </div>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'15px',gap:'15px',flexWrap:'wrap'}}>
                <div className="ad-search-box" style={{maxWidth:'400px',flex:1}}>
                  <Search size={16} className="ad-search-icon" />
                  <input
                    type="text"
                    placeholder="Search catalog by title, VJ, or category..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="ad-search-input"
                  />
                </div>
                <div style={{color:'var(--color-text-secondary)',fontSize:'0.85rem'}}>
                  Showing {filteredCatalogMovies.length.toLocaleString()} of {movies.length.toLocaleString()} loaded catalog items
                </div>
              </div>

              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead><tr><th>Title</th><th>VJ</th><th>Type</th><th>Category</th><th>Source</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredCatalogMovies.slice(0, 100).map(movie => (
                      <tr key={movie.id}>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                            <img src={movie.thumbnailUrl} alt={movie.title} style={{width:'52px',height:'30px',objectFit:'cover',borderRadius:'4px',flexShrink:0}}/>
                            <span style={{fontWeight:600}}>{movie.title}</span>
                          </div>
                        </td>
                        <td><span className="ad-vj-badge">{movie.vj||'VJ Junior'}</span></td>
                        <td><span className="ad-role-badge">{movie.type || 'MOVIE'}</span></td>
                        <td className="ad-muted" style={{fontSize:'0.82rem'}}>{movie.category || movie.region}</td>
                        <td><span className="ad-pkg-badge" style={{background:'rgba(255,255,255,0.06)'}}>{movie.source || 'Reelplexi API'}</span></td>
                        <td>
                          <div style={{display:'flex',gap:'6px'}}>
                            <button className="ad-ghost-btn" onClick={()=>handleOpenEdit(movie)}><Edit size={13}/></button>
                            <button className="ad-btn-danger-icon" onClick={()=>handleDeleteMovie(movie.id)}><Trash2 size={13}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredCatalogMovies.length === 0 && <tr><td colSpan="6" className="ad-empty">No matching items found in catalog.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── LIVEPAY ── */}
          {activeNav === 'livepay' && (
            <div className="ad-section">
              <div className="ad-card" style={{maxWidth:'680px'}}>
                <div className="ad-card-header" style={{justifyContent:'space-between'}}>
                  <span style={{display:'flex',alignItems:'center',gap:'8px'}}><Smartphone size={16} color="#e50914"/> LivePay Gateway</span>
                  <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer',fontSize:'0.82rem',fontWeight:700,color:livepayEnabled?'#46d369':'#666'}}>
                    <input type="checkbox" checked={livepayEnabled} onChange={e=>setLivepayEnabled(e.target.checked)} style={{accentColor:'#e50914',width:'16px',height:'16px'}}/>
                    {livepayEnabled ? 'ENABLED' : 'DISABLED'}
                  </label>
                </div>
                {livepaySaveStatus && <div className={`ad-alert ${livepaySaveStatus.startsWith('Error')?'ad-alert--error':'ad-alert--success'}`}>{livepaySaveStatus}</div>}
                <form onSubmit={handleSaveLivepaySettings} style={{display:'flex',flexDirection:'column',gap:'16px',marginTop:'8px'}}>
                  <div><label style={lbl}>LivePay API Key</label><input style={inp} type="text" placeholder="Bearer token..." value={livepayApiKey} onChange={e=>setLivepayApiKey(e.target.value)}/></div>
                  <div><label style={lbl}>Account Number</label><input style={inp} type="text" placeholder="e.g. LP2305443309" value={livepayAccountNumber} onChange={e=>setLivepayAccountNumber(e.target.value)}/></div>
                  <div>
                    <label style={lbl}>Webhook Callback URL (Paste in LivePay Portal)</label>
                    <div style={{display:'flex',gap:'8px'}}>
                      <input style={{...inp,fontFamily:'monospace',color:'#60a5fa',background:'#0b0c10'}} type="text" readOnly value={`${window.location.origin}/api/billing/livepay-callback`}/>
                      <button type="button" className="ad-ghost-btn" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/api/billing/livepay-callback`); alert('Webhook Callback URL copied to clipboard!'); }}>Copy URL</button>
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Webhook Verification Secret (Optional)</label>
                    <input style={inp} type="text" placeholder="e.g. whsec_xxxxxxxxxxxx" value={livepayWebhookSecret} onChange={e=>setLivepayWebhookSecret(e.target.value)}/>
                  </div>
                  <div style={{display:'flex',gap:'10px',justifyContent:'flex-end'}}>
                    <button type="button" className="ad-ghost-btn" onClick={handleTestLivepayConnection} disabled={testingLivepay||!livepayApiKey}>
                      <RefreshCw size={13}/> {testingLivepay?'Testing...':'Test Connection'}
                    </button>
                    <button type="submit" className="ad-action-btn"><Check size={14}/> Save Settings</button>
                  </div>
                </form>
                {livepayTestResult && (
                  <div className={`ad-alert ${livepayTestResult.success?'ad-alert--success':'ad-alert--error'}`} style={{marginTop:'16px'}}>
                    {livepayTestResult.success ? '✅ '+livepayTestResult.message : '❌ '+livepayTestResult.error}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── API KEY ── */}
          {activeNav === 'apikeys' && (
            <div className="ad-section">
              <div className="ad-card" style={{maxWidth:'680px'}}>
                <div className="ad-card-header"><Key size={16} color="#e50914"/> Reelplexi API Key</div>
                {saveStatus && <div className={`ad-alert ${saveStatus.startsWith('Error')?'ad-alert--error':'ad-alert--success'}`}>{saveStatus}</div>}
                <form onSubmit={handleSaveApiKey} style={{display:'flex',gap:'10px',marginTop:'8px'}}>
                  <input style={{...inp,flex:1}} type="text" placeholder="sk_live_xxxxxxxxxxxxxxxx" value={apiKey} onChange={e=>setApiKey(e.target.value)}/>
                  <button type="submit" className="ad-action-btn">Save Key</button>
                </form>
                <div className="ad-stats-row" style={{marginTop:'24px'}}>
                  <div className="ad-mini-stat"><div className="ad-mini-stat-lbl">Auth Header</div><div className="ad-mini-stat-val" style={{fontFamily:'monospace',fontSize:'0.8rem'}}>{apiKey?'••••'+apiKey.slice(-6):'Not Set'}</div></div>
                  <div className="ad-mini-stat"><div className="ad-mini-stat-lbl">Monthly Limit</div><div className="ad-mini-stat-val" style={{color:'#e50914'}}>50,000 req</div></div>
                  <div className="ad-mini-stat"><div className="ad-mini-stat-lbl">CDN Latency</div><div className="ad-mini-stat-val" style={{color:'#46d369'}}>sub-45ms</div></div>
                </div>
              </div>
            </div>
          )}

          {/* ── ANALYTICS ── */}
          {activeNav === 'analytics' && (
            <div className="ad-section">
              <div className="ad-card">
                <div className="ad-card-header"><Activity size={16} color="#e50914"/> Top VJ Titles</div>
                <table className="ad-table" style={{marginTop:'8px'}}>
                  <thead><tr><th>Title</th><th>VJ</th><th>Views</th><th>Genres</th></tr></thead>
                  <tbody>
                    {topMovies.map((item,idx)=>(
                      <tr key={idx}>
                        <td style={{fontWeight:600}}>{item.title}</td>
                        <td><span className="ad-vj-badge">{item.vj||'VJ Junior'}</span></td>
                        <td style={{color:'#46d369',fontWeight:700}}>{item.view_count||0} views</td>
                        <td className="ad-muted">{Array.isArray(item.genres)?item.genres.join(', '):item.genres}</td>
                      </tr>
                    ))}
                    {topMovies.length===0 && <tr><td colSpan="4" className="ad-empty">No analytics data yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav className="ad-mobile-nav">
        {NAV_ITEMS.map(item=>(
          <button key={item.id} className={`ad-mobile-tab ${activeNav===item.id?'ad-mobile-tab--active':''}`}
            onClick={()=>{ setActiveNav(item.id); if(item.id==='signups')fetchUserSignups(); if(item.id==='packages')fetchPackages(); if(item.id==='catalog')fetchMovies(); }}>
            {item.icon}<span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* MOVIE MODAL */}
      {showModal && (
        <div className="ad-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="ad-modal">
            <div className="ad-modal-header">
              <h2>{editingMovieId?'Edit Movie':'Add Movie'}</h2>
              <button className="ad-modal-close" onClick={()=>setShowModal(false)}><X size={20}/></button>
            </div>
            {error && <div className="ad-alert ad-alert--error">{error}</div>}
            <form onSubmit={handleSaveMovie} className="ad-modal-form">
              <div className="ad-field"><label style={lbl}>Title</label><input style={inp} value={title} onChange={e=>setTitle(e.target.value)} required/></div>
              <div className="ad-field"><label style={lbl}>VJ</label><select style={sel} value={vj} onChange={e=>setVj(e.target.value)}><option>VJ Junior</option><option>VJ Emmy</option><option>VJ Ice P</option><option>VJ Jingo</option><option>VJ Mark</option></select></div>
              <div className="ad-field ad-field--full"><label style={lbl}>Description</label><textarea style={{...inp,minHeight:'80px',resize:'vertical'}} value={description} onChange={e=>setDescription(e.target.value)} required/></div>
              <div className="ad-field"><label style={lbl}>Region</label><select style={sel} value={region} onChange={e=>setRegion(e.target.value)}><option value="east-african">East African</option><option value="kdrama">K-Drama</option><option value="nollywood">Nollywood</option><option value="western">Western</option><option value="bollywood">Bollywood</option><option value="anime">Anime</option></select></div>
              <div className="ad-field"><label style={lbl}>Category</label><select style={sel} value={category} onChange={e=>setCategory(e.target.value)}><option>UG VJ Exclusives</option><option>Trending VJ Movies</option><option>K-Drama Hits</option><option>Action &amp; Adventure</option><option>Top 10 Today</option></select></div>
              <div className="ad-field"><label style={lbl}>Thumbnail URL</label><input style={inp} type="url" value={thumbnailUrl} onChange={e=>setThumbnailUrl(e.target.value)} required/></div>
              <div className="ad-field"><label style={lbl}>Backdrop URL</label><input style={inp} type="url" value={backdropUrl} onChange={e=>setBackdropUrl(e.target.value)} required/></div>
              <div className="ad-field ad-field--full"><label style={lbl}>Video Stream URL</label><input style={inp} type="url" value={videoUrl} onChange={e=>setVideoUrl(e.target.value)} required/></div>
              <div className="ad-field"><label style={lbl}>Genres</label><input style={inp} placeholder="Action, Drama" value={genres} onChange={e=>setGenres(e.target.value)} required/></div>
              <div className="ad-field"><label style={lbl}>Release Year</label><input style={inp} type="number" value={releaseYear} onChange={e=>setReleaseYear(e.target.value)} required/></div>
              <div className="ad-field"><label style={lbl}>Type</label><select style={sel} value={type} onChange={e=>setType(e.target.value)}><option value="MOVIE">MOVIE</option><option value="SHOW">SHOW</option></select></div>
              <div className="ad-field"><label style={lbl}>Rating</label><select style={sel} value={rating} onChange={e=>setRating(e.target.value)}><option>PG-13</option><option>R</option><option>TV-MA</option><option>PG</option></select></div>
              <div className="ad-modal-footer">
                <button type="button" className="ad-ghost-btn" onClick={()=>setShowModal(false)}>Cancel</button>
                <button type="submit" className="ad-action-btn" disabled={loading}>{loading?'Saving...':'Save Movie'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PACKAGE MODAL */}
      {showPackageModal && (
        <div className="ad-overlay" onClick={e=>e.target===e.currentTarget&&setShowPackageModal(false)}>
          <div className="ad-modal">
            <div className="ad-modal-header">
              <h2>{editingPackageId?'Edit Package':'New Package'}</h2>
              <button className="ad-modal-close" onClick={()=>setShowPackageModal(false)}><X size={20}/></button>
            </div>
            {error && <div className="ad-alert ad-alert--error">{error}</div>}
            <form onSubmit={handleSavePackage} className="ad-modal-form">
              <div className="ad-field ad-field--full"><label style={lbl}>Package Name</label><input style={inp} value={pkgName} onChange={e=>setPkgName(e.target.value)} placeholder="e.g. Daily Pass" required/></div>
              <div className="ad-field"><label style={lbl}>Price</label><input style={inp} type="number" value={pkgPrice} onChange={e=>setPkgPrice(e.target.value)} required/></div>
              <div className="ad-field"><label style={lbl}>Currency</label><select style={sel} value={pkgCurrency} onChange={e=>setPkgCurrency(e.target.value)}><option value="UGX">UGX</option><option value="USD">USD</option><option value="KES">KES</option></select></div>
              <div className="ad-field"><label style={lbl}>Duration</label><input style={inp} type="number" min="0" value={pkgDurationVal} onChange={e=>setPkgDurationVal(e.target.value)} required/></div>
              <div className="ad-field"><label style={lbl}>Unit</label><select style={sel} value={pkgDurationUnit} onChange={e=>setPkgDurationUnit(e.target.value)}><option value="MINUTES">Minutes</option><option value="HOURS">Hours</option><option value="DAYS">Days</option><option value="WEEKS">Weeks</option><option value="MONTHS">Months</option><option value="YEARS">Years</option></select></div>
              <div className="ad-field ad-field--full">
                <div className="ad-duration-preview"><Clock size={14} color="#60a5fa"/> Duration: <strong>{pkgDurationVal==0?'Unlimited':`${pkgDurationVal} ${pkgDurationUnit.toLowerCase()}`}</strong></div>
              </div>
              <div className="ad-field"><label style={lbl}>Resolution</label><select style={sel} value={pkgResolution} onChange={e=>setPkgResolution(e.target.value)}><option value="720p HD">720p HD</option><option value="1080p Full HD">1080p Full HD</option><option value="4K Ultra HD">4K Ultra HD</option></select></div>
              <div className="ad-field"><label style={lbl}>Screens</label><input style={inp} type="number" min="1" max="10" value={pkgScreens} onChange={e=>setPkgScreens(e.target.value)} required/></div>
              <div className="ad-field ad-field--full"><label style={lbl}>Description</label><input style={inp} value={pkgDescription} onChange={e=>setPkgDescription(e.target.value)} placeholder="Short description..."/></div>
              <div className="ad-field ad-field--full"><label style={lbl}>Features (comma separated)</label><input style={inp} value={pkgFeatures} onChange={e=>setPkgFeatures(e.target.value)} placeholder="HD Quality, 2 Screens..."/></div>
              <div className="ad-field ad-field--full">
                <label style={{...lbl,display:'flex',alignItems:'center',gap:'8px',cursor:'pointer'}}>
                  <input type="checkbox" checked={pkgIsActive} onChange={e=>setPkgIsActive(e.target.checked)} style={{accentColor:'#e50914',width:'16px',height:'16px'}}/>
                  Active &amp; visible on checkout page
                </label>
              </div>
              <div className="ad-modal-footer">
                <button type="button" className="ad-ghost-btn" onClick={()=>setShowPackageModal(false)}>Cancel</button>
                <button type="submit" className="ad-action-btn" disabled={loading}>{loading?'Saving...':(editingPackageId?'Update Package':'Create Package')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
