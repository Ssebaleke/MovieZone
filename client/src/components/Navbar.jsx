import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, ChevronDown, User, LogOut, Settings, X, Mic, Globe, Menu, Home, Film, Tv, Flame, Sparkles, Check, ShieldCheck, Cast, LayoutGrid, Radio, Share2, Download, Headphones } from 'lucide-react';

export default function Navbar({
  onSearchChange = () => {},
  searchQuery = '',
  activeTab = 'home',
  setActiveTab = () => {},
  activeVJ = '',
  setActiveVJ = () => {},
  activeRegion = '',
  setActiveRegion = () => {}
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [selectedLang, setSelectedLang] = useState('English');
  const [currentUser, setCurrentUser] = useState(() => {
    const userStr = localStorage.getItem('netflix_user');
    return userStr ? JSON.parse(userStr) : null;
  });

  // Drawer expandable dropdown toggles
  const [isDrawerVjOpen, setIsDrawerVjOpen] = useState(false);
  const [isDrawerRegionOpen, setIsDrawerRegionOpen] = useState(false);

  // Window width tracking
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileDevice = windowWidth <= 1024;

  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const profile = localStorage.getItem('netflix_profile');
    if (profile) setCurrentProfile(JSON.parse(profile));
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('netflix_token');
    localStorage.removeItem('netflix_user');
    localStorage.removeItem('netflix_profile');
    navigate('/login');
  };

  const [vjsList, setVjsList] = useState([
    { name: 'All VJs', value: '' },
    { name: 'VJ Junior', value: 'VJ Junior' },
    { name: 'VJ Emmy', value: 'VJ Emmy' },
    { name: 'VJ Ice P', value: 'VJ Ice P' },
    { name: 'VJ Jingo', value: 'VJ Jingo' },
    { name: 'VJ Mark', value: 'VJ Mark' },
    { name: 'VJ KIIWA', value: 'VJ KIIWA' }
  ]);

  useEffect(() => {
    const token = localStorage.getItem('netflix_token');
    if (!token) return;
    fetch('/api/vj', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.data) && data.data.length > 0) {
          const fetched = data.data.map(vj => ({
            name: vj.name,
            value: vj.name
          }));
          setVjsList([{ name: 'All VJs', value: '' }, ...fetched]);
        }
      })
      .catch(err => console.error('Error loading VJs in Navbar:', err));
  }, []);

  const REGIONS_LIST = [
    { name: 'All Regions', slug: '' },
    { name: 'East African (UG / Local)', slug: 'east-african' },
    { name: 'K-Drama (Korean)', slug: 'kdrama' },
    { name: 'Nollywood (Nigerian)', slug: 'nollywood' },
    { name: 'Western (Hollywood)', slug: 'western' },
    { name: 'Bollywood (Indian)', slug: 'bollywood' },
    { name: 'Anime (Japanese)', slug: 'anime' }
  ];

  return (
    <div className="navbar-wrapper">
      <header className={`navbar-header ${isScrolled ? 'scrolled' : ''}`}>

        {/* ── MOBILE TOP BAR ── */}
        {isMobileDevice ? (
          <>
            {/* Left: Logo */}
            <div
              className="logo"
              style={{ cursor: 'pointer' }}
              onClick={() => { setActiveTab('home'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); navigate('/browse'); }}
            >
              <img src="/movie-zone-logo.svg" alt="Movie Zone" className="logo-svg" style={{ height: '30px', width: 'auto' }} />
            </div>

            {/* Center: Search bar */}
            <div className="mobile-topbar-search">
              <input
                type="text"
                placeholder="Search movies, VJs..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="mobile-search-input"
              />
              {searchQuery ? (
                <button className="mobile-search-clear-btn" onClick={() => onSearchChange('')} type="button">
                  <X size={13} color="#aaa" />
                </button>
              ) : (
                <Search size={14} color="#aaa" style={{ flexShrink: 0 }} />
              )}
            </div>

            {/* Right: Bell + Avatar */}
            <div className="mobile-topbar-right">
              <button className="mobile-header-icon-btn notification-badge-btn" aria-label="Notifications">
                <Bell size={20} color="#fff" />
                <span className="bell-badge-count">1</span>
              </button>
              {currentProfile ? (
                <div className="mobile-topbar-avatar" onClick={() => setIsMobileMenuOpen(true)}>
                  <img src={currentProfile.avatarUrl} alt={currentProfile.name} />
                </div>
              ) : (
                <button className="mobile-header-icon-btn" onClick={() => setIsMobileMenuOpen(true)} aria-label="Menu">
                  <Menu size={22} color="#fff" />
                </button>
              )}
            </div>
          </>
        ) : (
          /* ── DESKTOP TOP BAR ── */
          <>
            <div className="nav-left">
              <div className="logo" style={{ cursor: 'pointer' }} onClick={() => { setActiveTab('home'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); navigate('/browse'); }}>
                <img src="/movie-zone-logo.svg" alt="Movie Zone" className="logo-svg" style={{ height: '36px', width: 'auto' }} />
              </div>
              <ul className="nav-links desktop-only-links">
                <li className={activeTab === 'home' && !searchQuery && !activeVJ ? 'active' : ''} onClick={() => { setActiveTab('home'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); navigate('/browse'); }}>Home</li>
                <li className={activeTab === 'series' ? 'active' : ''} onClick={() => { setActiveTab('series'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); navigate('/browse'); }}>Series</li>
                <li className={activeTab === 'movies' ? 'active' : ''} onClick={() => { setActiveTab('movies'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); navigate('/browse'); }}>Movies</li>
                <li className={location.pathname === '/mylist' ? 'active' : ''} onClick={() => navigate('/mylist')}>My List</li>
                <li className={`nav-vj-item ${location.pathname.startsWith('/vjs') ? 'active' : ''}`}>
                  <span className="nav-vj-trigger" onClick={() => navigate('/vjs')}>
                    <Headphones size={14} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                    VJs <ChevronDown size={13} style={{ marginLeft: '3px', verticalAlign: 'middle' }} />
                  </span>
                  <div className="nav-vj-dropdown">
                    <div className="nav-vj-dropdown-header" onClick={() => navigate('/vjs')}>
                      <Headphones size={14} color="#e50914" /> All VJ Voices
                    </div>
                    {vjsList.filter(v => v.value).map(vj => (
                      <div
                        key={vj.value}
                        className="nav-vj-dropdown-item"
                        onClick={() => navigate(`/vjs/${encodeURIComponent(vj.value)}`)}
                      >
                        {vj.name}
                      </div>
                    ))}
                  </div>
                </li>
              </ul>
            </div>
            <div className="nav-right">
              <div className={`search-box desktop-only-search ${isSearchExpanded || searchQuery ? 'expanded' : ''}`}>
                <button className="search-btn-icon" onClick={() => { setIsSearchExpanded(true); setTimeout(() => searchInputRef.current?.focus(), 100); }} type="button">
                  <Search size={18} color="#fff" />
                </button>
                <input ref={searchInputRef} type="text" placeholder="Titles, VJs, genres..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} onBlur={() => { if (!searchQuery) setIsSearchExpanded(false); }} />
                {searchQuery && <button className="search-clear-btn" onClick={() => { onSearchChange(''); searchInputRef.current?.focus(); }} type="button"><X size={16} /></button>}
              </div>
              <button className="nav-icon-action-btn" onClick={() => alert('Share MovieZone & Earn Credits!')} title="Share & Earn" type="button">
                <Share2 size={18} color="#fff" /><span className="share-orange-dot" />
              </button>
              <button className="nav-icon-action-btn" type="button" title="Notifications">
                <Bell size={18} color="#fff" /><span className="notification-badge-red">1</span>
              </button>
              <button className="desktop-install-app-btn" onClick={() => alert('Install MovieZone App')} type="button">
                <Download size={14} style={{ marginRight: '6px' }} /> INSTALL APP
              </button>
              {currentProfile && (
                <div className="nav-profile-menu">
                  <div className="laba-avatar-box"><img src={currentProfile.avatarUrl} alt={currentProfile.name} /></div>
                  <ChevronDown size={14} color="#aaa" />
                  <div className="profile-dropdown">
                    <div className="dropdown-item" style={{ cursor: 'default', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '5px' }}><strong>{currentProfile.name}</strong></div>
                    <div className="dropdown-item" onClick={() => navigate('/profiles')}><User size={16} /> Manage Profiles</div>
                    <div className="dropdown-item" onClick={() => navigate('/account')}><Settings size={16} /> Account Settings</div>
                    <div className="dropdown-divider" />
                    <div className="dropdown-item" onClick={handleSignOut}><LogOut size={16} /> Sign out</div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </header>

      {/* Slide-Out Mobile Navigation Drawer (Opened via Nav Bar Icon ☰) */}
      {isMobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              {currentProfile ? (
                <div className="mobile-profile-info">
                  <img src={currentProfile.avatarUrl} alt={currentProfile.name} className="mobile-avatar" />
                  <div>
                    <div className="mobile-profile-name">{currentProfile.name}</div>
                    <span className="mobile-vj-badge">Uganda VIP Access</span>
                  </div>
                </div>
              ) : (
                <div className="mobile-profile-name">MovieZone</div>
              )}
              <button className="mobile-drawer-close" onClick={() => setIsMobileMenuOpen(false)}>
                <X size={24} color="#fff" />
              </button>
            </div>

            {/* Navigation Links inside Navbar Icon Menu */}
            <div className="mobile-section-title">
              <Film size={16} color="#fff" /> Navigation & Categories
            </div>
            <ul className="mobile-nav-list">
              <li
                className={activeTab === 'home' && !searchQuery ? 'active' : ''}
                onClick={() => { setActiveTab('home'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); setIsMobileMenuOpen(false); navigate('/browse'); }}
              >
                <Home size={18} /> Home
              </li>

              <li
                className={activeTab === 'latest' ? 'active' : ''}
                onClick={() => { setActiveTab('latest'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); setIsMobileMenuOpen(false); navigate('/browse'); }}
              >
                <Sparkles size={18} /> Latest Releases
              </li>

              <li
                className={activeTab === 'trending' ? 'active' : ''}
                onClick={() => { setActiveTab('trending'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); setIsMobileMenuOpen(false); navigate('/browse'); }}
              >
                <Flame size={18} /> Trending Now
              </li>

              {/* Expandable Regions Dropdown Menu inside Navbar Icon Drawer */}
              <li className="mobile-nav-dropdown-item">
                <div
                  className={`mobile-nav-dropdown-header ${isDrawerRegionOpen || activeRegion ? 'active' : ''}`}
                  onClick={() => setIsDrawerRegionOpen(!isDrawerRegionOpen)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Globe size={18} color="#46d369" /> Select Region
                  </span>
                  <ChevronDown size={16} className={`vj-chevron ${isDrawerRegionOpen ? 'open' : ''}`} />
                </div>

                {isDrawerRegionOpen && (
                  <ul className="mobile-nested-dropdown-list">
                    {REGIONS_LIST.map((reg) => (
                      <li
                        key={reg.name}
                        className={activeRegion === reg.slug ? 'selected' : ''}
                        onClick={() => {
                          setActiveRegion(reg.slug);
                          setActiveTab('regions');
                          onSearchChange('');
                          setIsMobileMenuOpen(false);
                          navigate('/browse');
                        }}
                      >
                        <Globe size={12} color={activeRegion === reg.slug ? '#fff' : '#46d369'} />
                        {reg.name}
                        {activeRegion === reg.slug && <Check size={14} color="#fff" style={{ marginLeft: 'auto' }} />}
                      </li>
                    ))}
                  </ul>
                )}
              </li>

              <li
                className={location.pathname === '/mylist' ? 'active' : ''}
                onClick={() => { setIsMobileMenuOpen(false); navigate('/mylist'); }}
              >
                <User size={18} /> My Watchlist
              </li>
            </ul>

            {/* Mobile Footer Actions */}
            <div className="mobile-drawer-footer">
              <button className="mobile-signout-btn" onClick={handleSignOut}>
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <div
          className={`mobile-bottom-tab ${location.pathname === '/browse' && activeTab === 'home' && !searchQuery ? 'active' : location.pathname === '/movie' || location.pathname.startsWith('/movie/') ? '' : ''}`}
          onClick={() => { setActiveTab('home'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); navigate('/browse'); }}
        >
          <Home size={20} color={location.pathname === '/browse' && activeTab === 'home' && !searchQuery ? '#e50914' : '#aaaaaa'} />
          <span>Home</span>
        </div>

        <div
          className={`mobile-bottom-tab ${activeTab === 'movies' ? 'active' : ''}`}
          onClick={() => { setActiveTab('movies'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); navigate('/browse'); }}
        >
          <Film size={20} color={activeTab === 'movies' ? '#e50914' : '#aaaaaa'} />
          <span>Movies</span>
        </div>

        <div
          className={`mobile-bottom-tab ${activeTab === 'series' ? 'active' : ''}`}
          onClick={() => { setActiveTab('series'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); navigate('/browse'); }}
        >
          <Tv size={20} color={activeTab === 'series' ? '#e50914' : '#aaaaaa'} />
          <span>Series</span>
        </div>

        <div
          className={`mobile-bottom-tab`}
          onClick={() => navigate('/vjs')}
        >
          <Headphones size={20} color={location.pathname === '/vjs' ? '#e50914' : '#aaaaaa'} />
          <span>VJs</span>
        </div>

        <div
          className={`mobile-bottom-tab ${location.pathname === '/account' || location.pathname === '/profiles' ? 'active' : ''}`}
          onClick={() => navigate('/account')}
        >
          <User size={20} color={location.pathname === '/account' || location.pathname === '/profiles' ? '#e50914' : '#aaaaaa'} />
          <span>You</span>
        </div>
      </nav>
    </div>
  );
}
