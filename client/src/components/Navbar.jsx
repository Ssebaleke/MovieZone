import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, ChevronDown, User, LogOut, Settings, X, Mic, Globe, Menu, Home, Film, Tv, Flame, Sparkles, Check } from 'lucide-react';

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

  // Drawer expandable dropdown toggles
  const [isDrawerVjOpen, setIsDrawerVjOpen] = useState(false);
  const [isDrawerRegionOpen, setIsDrawerRegionOpen] = useState(false);

  // Top mobile header dropdown toggle
  const [isMobileVjDropdownOpen, setIsMobileVjDropdownOpen] = useState(false);
  const [vjSearchTerm, setVjSearchTerm] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef(null);
  const vjDropdownRef = useRef(null);

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

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (vjDropdownRef.current && !vjDropdownRef.current.contains(e.target)) {
        setIsMobileVjDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const filteredVjs = vjsList.filter(vj => 
    vj.name.toLowerCase().includes(vjSearchTerm.toLowerCase())
  );

  return (
    <>
      <header className={`navbar-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-left">
          {/* Mobile Hamburger Navigation Bar Icon */}
          <button
            className="mobile-menu-toggle-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            type="button"
          >
            {isMobileMenuOpen ? <X size={24} color="#fff" /> : <Menu size={24} color="#fff" />}
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
              setIsMobileVjDropdownOpen(false);
              navigate('/browse');
            }}
          >
            <img src="/movie-zone-logo.svg" alt="Movie Zone" className="logo-svg" style={{ height: '38px', width: 'auto' }} />
          </div>

          {/* Desktop Navigation Links */}
          <ul className="nav-links desktop-only-links">
            <li
              className={activeTab === 'home' && !searchQuery ? 'active' : ''}
              onClick={() => { setActiveTab('home'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); navigate('/browse'); }}
            >
              Home
            </li>

            {/* Ugandan VJs Desktop Mega Dropdown (4-5 Columns) */}
            <li className={`nav-item-dropdown ${activeTab === 'vj' || activeVJ ? 'active' : ''}`}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mic size={14} color="#e50914" /> Ugandan VJs <ChevronDown size={14} />
              </span>
              <div className="nav-dropdown-menu vj-mega-dropdown">
                {vjsList.map((vj) => (
                  <div
                    key={vj.name}
                    className={`dropdown-item ${activeVJ === vj.value ? 'selected' : ''}`}
                    onClick={() => {
                      setActiveVJ(vj.value);
                      setActiveTab('vj');
                      onSearchChange('');
                      navigate('/browse');
                    }}
                  >
                    <Mic size={12} color={activeVJ === vj.value ? '#fff' : '#e50914'} style={{ marginRight: '6px' }} />
                    {vj.name}
                  </div>
                ))}
              </div>
            </li>

            <li
              className={activeTab === 'series' ? 'active' : ''}
              onClick={() => { setActiveTab('series'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); navigate('/browse'); }}
            >
              TV Series
            </li>

            <li
              className={activeTab === 'movies' ? 'active' : ''}
              onClick={() => { setActiveTab('movies'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); navigate('/browse'); }}
            >
              Movies
            </li>

            <li
              className={activeTab === 'latest' ? 'active' : ''}
              onClick={() => { setActiveTab('latest'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); navigate('/browse'); }}
            >
              Latest
            </li>

            <li
              className={activeTab === 'trending' ? 'active' : ''}
              onClick={() => { setActiveTab('trending'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); navigate('/browse'); }}
            >
              Trending
            </li>

            <li className={`nav-item-dropdown ${activeTab === 'regions' || activeRegion ? 'active' : ''}`}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Globe size={14} color="#46d369" /> Regions <ChevronDown size={14} />
              </span>
              <div className="nav-dropdown-menu">
                {REGIONS_LIST.map((reg) => (
                  <div
                    key={reg.name}
                    className={`dropdown-item ${activeRegion === reg.slug ? 'selected' : ''}`}
                    onClick={() => {
                      setActiveRegion(reg.slug);
                      setActiveTab('regions');
                      onSearchChange('');
                      navigate('/browse');
                    }}
                  >
                    {reg.name}
                  </div>
                ))}
              </div>
            </li>

            <li
              className={location.pathname === '/mylist' ? 'active' : ''}
              onClick={() => navigate('/mylist')}
            >
              My List
            </li>
          </ul>
        </div>

        {/* Right Section */}
        <div className="nav-right">
          {/* Expanding Search Bar */}
          <div className={`search-box ${isSearchExpanded || searchQuery ? 'expanded' : ''}`}>
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
              <Search size={18} />
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

          {/* User Notifications */}
          <button className="player-control-icon-btn notifications-btn" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Bell size={20} />
            <span className="notification-badge">11</span>
          </button>

          {/* Profile Dropdown */}
          {currentProfile && (
            <div className="nav-profile-menu">
              <div className="nav-profile-avatar">
                <img src={currentProfile.avatarUrl} alt={currentProfile.name} />
              </div>
              <ChevronDown size={16} className="desktop-only-icon" />

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

              {/* Expandable Ugandan VJs Dropdown Menu inside Navbar Icon Drawer */}
              <li className="mobile-nav-dropdown-item">
                <div
                  className={`mobile-nav-dropdown-header ${isDrawerVjOpen || activeVJ ? 'active' : ''}`}
                  onClick={() => setIsDrawerVjOpen(!isDrawerVjOpen)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Mic size={18} color="#e50914" /> Ugandan VJs
                  </span>
                  <ChevronDown size={16} className={`vj-chevron ${isDrawerVjOpen ? 'open' : ''}`} />
                </div>

                {isDrawerVjOpen && (
                  <ul className="mobile-nested-dropdown-list vj-columns-grid">
                    {vjsList.map((vj) => (
                      <li
                        key={vj.name}
                        className={activeVJ === vj.value ? 'selected' : ''}
                        onClick={() => {
                          setActiveVJ(vj.value);
                          setActiveTab('vj');
                          onSearchChange('');
                          setIsMobileMenuOpen(false);
                          navigate('/browse');
                        }}
                      >
                        <Mic size={12} color={activeVJ === vj.value ? '#fff' : '#e50914'} />
                        {vj.name}
                        {activeVJ === vj.value && <Check size={14} color="#fff" style={{ marginLeft: 'auto' }} />}
                      </li>
                    ))}
                  </ul>
                )}
              </li>

              <li
                className={activeTab === 'series' ? 'active' : ''}
                onClick={() => { setActiveTab('series'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); setIsMobileMenuOpen(false); navigate('/browse'); }}
              >
                <Tv size={18} /> TV Series
              </li>
              <li
                className={activeTab === 'movies' ? 'active' : ''}
                onClick={() => { setActiveTab('movies'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); setIsMobileMenuOpen(false); navigate('/browse'); }}
              >
                <Film size={18} /> Movies
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

      {/* Sleek Mobile Bottom Tab Bar for Smartphones */}
      <nav className="mobile-bottom-nav">
        <div
          className={`mobile-bottom-tab ${activeTab === 'home' && !searchQuery ? 'active' : ''}`}
          onClick={() => { setActiveTab('home'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); navigate('/browse'); }}
        >
          <Home size={20} />
          <span>Home</span>
        </div>

        <div
          className={`mobile-bottom-tab ${activeTab === 'vj' || activeVJ ? 'active' : ''}`}
          onClick={() => {
            setIsMobileMenuOpen(true);
            setIsDrawerVjOpen(true);
          }}
        >
          <Mic size={20} color="#e50914" />
          <span>VJs</span>
        </div>

        <div
          className={`mobile-bottom-tab ${activeTab === 'series' ? 'active' : ''}`}
          onClick={() => { setActiveTab('series'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); navigate('/browse'); }}
        >
          <Tv size={20} />
          <span>Series</span>
        </div>

        <div
          className={`mobile-bottom-tab ${activeTab === 'movies' ? 'active' : ''}`}
          onClick={() => { setActiveTab('movies'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); navigate('/browse'); }}
        >
          <Film size={20} />
          <span>Movies</span>
        </div>

        <div
          className={`mobile-bottom-tab ${searchQuery ? 'active' : ''}`}
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Search size={20} />
          <span>Search</span>
        </div>
      </nav>
    </>
  );
}
