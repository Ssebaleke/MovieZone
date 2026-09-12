import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, ChevronDown, User, LogOut, Settings, X, Mic, Globe } from 'lucide-react';

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
    { name: 'VJ Mark', value: 'VJ Mark' }
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
    <header className={`navbar-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-left">
        <div className="logo" style={{ cursor: 'pointer' }} onClick={() => { setActiveTab('home'); onSearchChange(''); navigate('/browse'); }}>
          <img src="/movie-zone-logo.svg" alt="Movie Zone" style={{ height: '38px', width: 'auto' }} />
        </div>

        <ul className="nav-links">
          {/* 1. Home */}
          <li
            className={activeTab === 'home' && !searchQuery ? 'active' : ''}
            onClick={() => { setActiveTab('home'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); navigate('/browse'); }}
          >
            Home
          </li>

          {/* 2. Ugandan VJs Dropdown Menu */}
          <li className={`nav-item-dropdown ${activeTab === 'vj' || activeVJ ? 'active' : ''}`}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Mic size={14} color="#e50914" /> Ugandan VJs <ChevronDown size={14} />
            </span>
            <div className="nav-dropdown-menu" style={{ maxHeight: '350px', overflowY: 'auto' }}>
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
                  {vj.name}
                </div>
              ))}
            </div>
          </li>

          {/* 3. TV Series */}
          <li
            className={activeTab === 'series' ? 'active' : ''}
            onClick={() => { setActiveTab('series'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); navigate('/browse'); }}
          >
            TV Series
          </li>

          {/* 4. Movies */}
          <li
            className={activeTab === 'movies' ? 'active' : ''}
            onClick={() => { setActiveTab('movies'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); navigate('/browse'); }}
          >
            Movies
          </li>

          {/* 5. Latest */}
          <li
            className={activeTab === 'latest' ? 'active' : ''}
            onClick={() => { setActiveTab('latest'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); navigate('/browse'); }}
          >
            Latest
          </li>

          {/* 6. Trending */}
          <li
            className={activeTab === 'trending' ? 'active' : ''}
            onClick={() => { setActiveTab('trending'); setActiveVJ(''); setActiveRegion(''); onSearchChange(''); navigate('/browse'); }}
          >
            Trending
          </li>

          {/* 7. Multi-Region Dropdown */}
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

          {/* 8. My List */}
          <li
            className={location.pathname === '/mylist' ? 'active' : ''}
            onClick={() => navigate('/mylist')}
          >
            My List
          </li>
        </ul>
      </div>

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
        <button className="player-control-icon-btn" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Bell size={20} />
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#e50914',
            color: '#fff',
            fontSize: '0.65rem',
            fontWeight: 'bold',
            borderRadius: '10px',
            padding: '2px 4px',
            lineHeight: '1',
            minWidth: '15px',
            textAlign: 'center'
          }}>11</span>
        </button>

        {currentProfile && (
          <div className="nav-profile-menu">
            <div className="nav-profile-avatar">
              <img src={currentProfile.avatarUrl} alt={currentProfile.name} />
            </div>
            <ChevronDown size={16} />
            
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
  );
}
