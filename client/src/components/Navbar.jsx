import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, ChevronDown, User, LogOut, Settings, X, Mic, Globe, Menu, Home, Film, Tv, Flame, Sparkles, Check, ShieldCheck, Cast, LayoutGrid, Radio, Share2, Download } from 'lucide-react';

export default function Navbar({
  onSearchChange,
  searchQuery,
  activeTab = 'home',
  setActiveTab,
  activeVJ = '',
  setActiveVJ,
  activeRegion = '',
  setActiveRegion
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
      {/* Top Announcement Banner matching labafilms.online */}
      {showAnnouncement && (
        <div className="announcement-bar">
          <div className="announcement-content" onClick={() => alert('Share your referral link with friends to get free credits!')}>
            <Share2 size={13} color="#d97706" style={{ marginRight: '6px' }} />
            <span>Share any movie & earn 2 free credits — <strong className="tap-link">tap to learn more</strong></span>
          </div>
          <button className="announcement-close-btn" onClick={() => setShowAnnouncement(false)} type="button" aria-label="Close banner">
            <X size={14} color="#888" />
          </button>
        </div>
      )}

      <header className={`navbar-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-left">
          {/* Mobile Hamburger Navigation Bar Icon */}
          <button
            className="mobile-menu-toggle-btn desktop-hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            type="button"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
          >
            {isMobileMenuOpen ? <X size={24} color="#e50914" /> : <Menu size={24} color="#e50914" />}
          </button>

          {/* Logo */}
          <div
            className="logo"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setActiveTab('home');
              setActiveVJ('');
              setActiveRegion('');
              onSearchChange('');
              setIsMobileMenuOpen(false);
              navigate('/browse');
            }}
          >
            <img src="/movie-zone-logo.svg" alt="Movie Zone" className="logo-svg" style={{ height: '36px', width: 'auto' }} />
          </div>

          {/* Desktop Navigation Links (Visible ONLY on widescreen > 1024px matching labafilms.online screenshot) */}
          {!isMobileDevice && (
            <ul className="nav-links desktop-only-links">
              <li
                className={activeTab === 'home' && !searchQuery && !activeVJ ? 'active' : ''}
                onClick={() => { setActiveTab('home'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); navigate('/browse'); }}
              >
                Home
              </li>

              <li
                className={activeTab === 'movies' ? 'active' : ''}
                onClick={() => { setActiveTab('movies'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); navigate('/browse'); }}
              >
                Movies
              </li>

              <li
                className={activeTab === 'series' ? 'active' : ''}
                onClick={() => { setActiveTab('series'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); navigate('/browse'); }}
              >
                TV Shows
              </li>

              <li
                className={location.pathname === '/mylist' ? 'active' : ''}
                onClick={() => navigate('/mylist')}
              >
                My List
              </li>

              {/* Language Selector matching screenshot */}
              <li className="nav-item-dropdown">
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  {selectedLang} <ChevronDown size={14} color="#aaa" />
                </span>
                <div className="nav-dropdown-menu">
                  <div className="dropdown-item selected" onClick={() => setSelectedLang('English')}>English</div>
                  <div className="dropdown-item" onClick={() => setSelectedLang('Luganda')}>Luganda</div>
                  <div className="dropdown-item" onClick={() => setSelectedLang('Swahili')}>Swahili</div>
                </div>
              </li>
            </ul>
          )}

          {/* Mobile Header Search Bar replacing text links on small devices */}
          {isMobileDevice && (
            <div className="mobile-header-search-bar" style={{ display: 'flex', marginLeft: '10px', flex: 1, maxWidth: '280px' }}>
              <Search size={16} color="#aaaaaa" style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search titles, VJs..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="mobile-search-input"
              />
              {searchQuery && (
                <button className="mobile-search-clear-btn" onClick={() => onSearchChange('')} type="button">
                  <X size={14} color="#aaaaaa" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Section matching labafilms.online screenshot */}
        <div className="nav-right">
          {/* Mobile Only Header Actions */}
          <div className="mobile-header-actions-right">
            <button className="mobile-header-icon-btn" aria-label="Cast">
              <Cast size={20} color="#ffffff" />
            </button>
            <button className="mobile-header-icon-btn notification-badge-btn" aria-label="Notifications">
              <Bell size={20} color="#ffffff" />
              <span className="bell-badge-count">1</span>
            </button>
            <button
              className="mobile-header-icon-btn"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Search"
            >
              <Search size={20} color="#ffffff" />
            </button>
          </div>

          {/* Desktop Search Bar */}
          <div className={`search-box desktop-only-search ${isSearchExpanded || searchQuery ? 'expanded' : ''}`}>
            <button
              className="search-btn-icon"
              onClick={() => {
                setIsSearchExpanded(true);
                setTimeout(() => {
                  if (searchInputRef.current) searchInputRef.current.focus();
                }, 100);
              }}
              type="button"
            >
              <Search size={18} color="#fff" />
            </button>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Titles, VJs, genres..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onBlur={() => { if (!searchQuery) setIsSearchExpanded(false); }}
            />
            {searchQuery && (
              <button
                className="search-clear-btn"
                onClick={() => {
                  onSearchChange('');
                  if (searchInputRef.current) searchInputRef.current.focus();
                }}
                type="button"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Desktop Share Button with Orange Badge Dot */}
          <button
            className="nav-icon-action-btn desktop-only-icon"
            onClick={() => alert('Share MovieZone & Earn Credits!')}
            title="Share & Earn"
            type="button"
          >
            <Share2 size={18} color="#ffffff" />
            <span className="share-orange-dot" />
          </button>

          {/* Desktop Notifications Bell with Red Circular Badge '1' */}
          <button className="nav-icon-action-btn notifications-btn desktop-only-icon" type="button" title="Notifications">
            <Bell size={18} color="#ffffff" />
            <span className="notification-badge-red">1</span>
          </button>

          {/* Desktop INSTALL APP Button matching screenshot */}
          <button
            className="desktop-install-app-btn desktop-only-btn"
            onClick={() => alert('Install MovieZone App on Desktop / Mobile')}
            type="button"
          >
            <Download size={14} style={{ marginRight: '6px' }} /> INSTALL APP
          </button>

          {/* Profile Dropdown */}
          {currentProfile && (
            <div className="nav-profile-menu desktop-only-icon">
              <div className="laba-avatar-box">
                <img src={currentProfile.avatarUrl} alt={currentProfile.name} />
              </div>
              <ChevronDown size={14} color="#aaaaaa" />

              <div className="profile-dropdown">
                <div className="dropdown-item" style={{ cursor: 'default', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '5px' }}>
                  <strong>{currentProfile.name}</strong>
                </div>
                <div className="dropdown-item" onClick={() => navigate('/profiles')}>
                  <User size={16} /> Manage Profiles
                </div>
                <div className="dropdown-item" onClick={() => navigate('/account')}>
                  <Settings size={16} /> Account Settings
                </div>
                <div className="dropdown-divider" />
                <div className="dropdown-item" onClick={handleSignOut}>
                  <LogOut size={16} /> Sign out
                </div>
              </div>
            </div>
          )}
        </div>
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

            {/* Search inside navbar icon drawer */}
            <div className="mobile-drawer-search">
              <Search size={18} color="#aaa" />
              <input
                type="text"
                placeholder="Search movies, Ugandan VJs..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => onSearchChange('')} style={{ background: 'none', border: 'none' }}>
                  <X size={16} color="#aaa" />
                </button>
              )}
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

      {/* Mobile Bottom Navigation Bar matching Mobile Design Screenshot */}
      <nav className="mobile-bottom-nav">
        <div
          className={`mobile-bottom-tab ${activeTab === 'home' && !searchQuery ? 'active' : ''}`}
          onClick={() => { setActiveTab('home'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); navigate('/browse'); }}
        >
          <Home size={20} color={activeTab === 'home' && !searchQuery ? '#e50914' : '#aaaaaa'} />
          <span>Home</span>
        </div>

        <div
          className={`mobile-bottom-tab ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => {
            setIsMobileMenuOpen(true);
          }}
        >
          <LayoutGrid size={20} color={activeTab === 'categories' ? '#e50914' : '#aaaaaa'} />
          <span>Categories</span>
        </div>

        <div
          className={`mobile-bottom-tab ${activeTab === 'radio' ? 'active' : ''}`}
          onClick={() => alert('Radio Live Streaming Coming Soon!')}
        >
          <Radio size={20} color={activeTab === 'radio' ? '#e50914' : '#aaaaaa'} />
          <span>Radio</span>
        </div>

        <div
          className={`mobile-bottom-tab ${activeTab === 'series' || activeTab === 'tv' ? 'active' : ''}`}
          onClick={() => { setActiveTab('series'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); navigate('/browse'); }}
        >
          <Tv size={20} color={activeTab === 'series' || activeTab === 'tv' ? '#e50914' : '#aaaaaa'} />
          <span>Live TV</span>
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
