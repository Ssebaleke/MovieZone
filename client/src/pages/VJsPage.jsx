import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Headphones, Play, Search, X } from 'lucide-react';

const DEFAULT_VJS = [
  { name: 'VJ Junior', slug: 'VJ Junior', tagline: 'The Voice of Uganda',   specialty: 'Action • Drama • Nollywood', color: '#f59e0b' },
  { name: 'VJ Emmy',   slug: 'VJ Emmy',   tagline: 'Smooth & Soulful',      specialty: 'Romance • K-Drama',          color: '#8b5cf6' },
  { name: 'VJ Ice P',  slug: 'VJ Ice P',  tagline: 'Cool & Crisp',          specialty: 'Thriller • Sci-Fi',          color: '#06b6d4' },
  { name: 'VJ Jingo',  slug: 'VJ Jingo',  tagline: 'Energy & Vibes',        specialty: 'Comedy • Animation',         color: '#10b981' },
  { name: 'VJ Mark',   slug: 'VJ Mark',   tagline: 'Deep & Dramatic',       specialty: 'Drama • Bollywood',          color: '#e50914' },
  { name: 'VJ KIIWA',  slug: 'VJ KIIWA',  tagline: 'Bold & Fearless',       specialty: 'Horror • Western',           color: '#f97316' },
];

const COLORS = DEFAULT_VJS.map(v => v.color);

function avatarUrl(name, color) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color.replace('#','')}&color=fff&size=200&bold=true&font-size=0.4`;
}

function pinJuniorFirst(list) {
  const idx = list.findIndex(v => v.name.toLowerCase().includes('junior'));
  if (idx <= 0) return list;
  const junior = list[idx];
  return [junior, ...list.slice(0, idx), ...list.slice(idx + 1)];
}

export default function VJsPage({ setActiveVJ, setActiveTab }) {
  const navigate = useNavigate();
  const [vjList, setVjList] = useState(DEFAULT_VJS);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('netflix_token');
    if (!token) return;
    fetch('/api/vj', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data?.data) && data.data.length > 0) {
          const fetched = data.data.map((vj, i) => ({
            name: vj.name,
            slug: vj.name,
            tagline: vj.tagline || 'Ugandan VJ',
            specialty: vj.specialty || 'Movies & Series',
            color: COLORS[i % COLORS.length],
            avatar: vj.avatarUrl || avatarUrl(vj.name, COLORS[i % COLORS.length]),
          }));
          setVjList(pinJuniorFirst(fetched));
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectVJ = (vj) => {
    navigate(`/vjs/${encodeURIComponent(vj.slug)}`);
  };

  const q = query.trim().toLowerCase();
  const filtered = q ? vjList.filter(v => v.name.toLowerCase().includes(q) || v.specialty.toLowerCase().includes(q)) : vjList;

  const featured = !q ? filtered[0] : null;
  const grid = !q ? filtered.slice(1) : filtered;

  return (
    <div className="vjs-page">
      {/* Header */}
      <div className="vjs-page-header">
        <button className="vjs-back-btn" onClick={() => navigate('/browse')}>
          <ArrowLeft size={20} />
        </button>
        <div className="vjs-page-title-wrap">
          <Headphones size={22} color="#e50914" />
          <h1>VJ Voices</h1>
        </div>
        <div style={{ width: 38 }} />
      </div>

      <div className="vjs-page-body">
        <p className="vjs-page-subtitle">Choose your favourite Ugandan VJ and enjoy movies in your language</p>

        {/* Search bar */}
        <div className="vjs-search-wrap">
          <Search size={16} color="#888" className="vjs-search-icon" />
          <input
            className="vjs-search-input"
            type="text"
            placeholder="Search VJs..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button className="vjs-search-clear" onClick={() => setQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Featured card — VJ Junior (hidden when searching) */}
        {featured && (
          <div
            className="vjs-featured-card"
            style={{ '--vj-color': featured.color }}
            onClick={() => handleSelectVJ(featured)}
          >
            <div className="vjs-featured-avatar-wrap">
              <img src={featured.avatar || avatarUrl(featured.name, featured.color)} alt={featured.name} className="vjs-featured-avatar" />
              <div className="vjs-featured-crown">⭐ #1</div>
            </div>
            <div className="vjs-featured-info">
              <div className="vjs-featured-badge">MOST POPULAR</div>
              <h2 className="vjs-featured-name">{featured.name}</h2>
              <p className="vjs-featured-tagline">{featured.tagline}</p>
              <p className="vjs-featured-specialty">{featured.specialty}</p>
              <button className="vjs-featured-btn">
                <Play size={15} fill="#000" /> Watch with {featured.name}
              </button>
            </div>
          </div>
        )}

        {/* 3-column grid */}
        {grid.length > 0 ? (
          <div className="vjs-grid">
            {grid.map((vj) => (
              <div
                key={vj.slug}
                className="vjs-card"
                style={{ '--vj-color': vj.color }}
                onClick={() => handleSelectVJ(vj)}
              >
                <img src={vj.avatar || avatarUrl(vj.name, vj.color)} alt={vj.name} className="vjs-card-avatar" />
                <div className="vjs-card-name">{vj.name}</div>
                <div className="vjs-card-tagline">{vj.tagline}</div>
                <div className="vjs-card-specialty">{vj.specialty}</div>
                <div className="vjs-card-play-btn">
                  <Play size={13} fill="currentColor" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="vjs-no-results">No VJs found for "{query}"</div>
        )}
      </div>
    </div>
  );
}
