import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Headphones, Play, Star } from 'lucide-react';

const DEFAULT_VJS = [
  {
    name: 'VJ Junior',
    slug: 'VJ Junior',
    tagline: 'The Voice of Uganda',
    specialty: 'Action • Drama • Nollywood',
    color: '#f59e0b',
    avatar: 'https://ui-avatars.com/api/?name=VJ+Junior&background=f59e0b&color=fff&size=200&bold=true&font-size=0.4',
    featured: true,
  },
  {
    name: 'VJ Emmy',
    slug: 'VJ Emmy',
    tagline: 'Smooth & Soulful',
    specialty: 'Romance • K-Drama',
    color: '#8b5cf6',
    avatar: 'https://ui-avatars.com/api/?name=VJ+Emmy&background=8b5cf6&color=fff&size=200&bold=true&font-size=0.4',
  },
  {
    name: 'VJ Ice P',
    slug: 'VJ Ice P',
    tagline: 'Cool & Crisp',
    specialty: 'Thriller • Sci-Fi',
    color: '#06b6d4',
    avatar: 'https://ui-avatars.com/api/?name=VJ+Ice+P&background=06b6d4&color=fff&size=200&bold=true&font-size=0.4',
  },
  {
    name: 'VJ Jingo',
    slug: 'VJ Jingo',
    tagline: 'Energy & Vibes',
    specialty: 'Comedy • Animation',
    color: '#10b981',
    avatar: 'https://ui-avatars.com/api/?name=VJ+Jingo&background=10b981&color=fff&size=200&bold=true&font-size=0.4',
  },
  {
    name: 'VJ Mark',
    slug: 'VJ Mark',
    tagline: 'Deep & Dramatic',
    specialty: 'Drama • Bollywood',
    color: '#e50914',
    avatar: 'https://ui-avatars.com/api/?name=VJ+Mark&background=e50914&color=fff&size=200&bold=true&font-size=0.4',
  },
  {
    name: 'VJ KIIWA',
    slug: 'VJ KIIWA',
    tagline: 'Bold & Fearless',
    specialty: 'Horror • Western',
    color: '#f97316',
    avatar: 'https://ui-avatars.com/api/?name=VJ+KIIWA&background=f97316&color=fff&size=200&bold=true&font-size=0.4',
  },
];

export default function VJsPage({ setActiveVJ, setActiveTab }) {
  const navigate = useNavigate();
  const [vjList, setVjList] = useState(DEFAULT_VJS);

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
            color: DEFAULT_VJS[i % DEFAULT_VJS.length]?.color || '#e50914',
            avatar: vj.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(vj.name)}&background=e50914&color=fff&size=200&bold=true`,
            featured: i === 0,
          }));
          setVjList(fetched);
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectVJ = (vj) => {
    if (setActiveVJ) setActiveVJ(vj.slug);
    if (setActiveTab) setActiveTab('vj');
    navigate('/browse');
  };

  const featured = vjList[0];
  const rest = vjList.slice(1);

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
        <div style={{ width: 40 }} />
      </div>

      <div className="vjs-page-body">
        <p className="vjs-page-subtitle">Choose your favourite Ugandan VJ and enjoy movies in your language</p>

        {/* Featured VJ — VJ Junior */}
        {featured && (
          <div className="vjs-featured-card" style={{ '--vj-color': featured.color }} onClick={() => handleSelectVJ(featured)}>
            <div className="vjs-featured-avatar-wrap">
              <img src={featured.avatar} alt={featured.name} className="vjs-featured-avatar" />
              <div className="vjs-featured-crown">⭐ #1</div>
            </div>
            <div className="vjs-featured-info">
              <div className="vjs-featured-badge">MOST POPULAR</div>
              <h2 className="vjs-featured-name">{featured.name}</h2>
              <p className="vjs-featured-tagline">{featured.tagline}</p>
              <p className="vjs-featured-specialty">{featured.specialty}</p>
              <button className="vjs-featured-btn">
                <Play size={15} fill="#fff" /> Watch with {featured.name}
              </button>
            </div>
          </div>
        )}

        {/* Grid — 3 columns */}
        <div className="vjs-grid">
          {rest.map((vj) => (
            <div
              key={vj.slug}
              className="vjs-card"
              style={{ '--vj-color': vj.color }}
              onClick={() => handleSelectVJ(vj)}
            >
              <div className="vjs-card-avatar-wrap">
                <img src={vj.avatar} alt={vj.name} className="vjs-card-avatar" />
              </div>
              <div className="vjs-card-info">
                <div className="vjs-card-name">{vj.name}</div>
                <div className="vjs-card-tagline">{vj.tagline}</div>
                <div className="vjs-card-specialty">{vj.specialty}</div>
              </div>
              <div className="vjs-card-play-btn">
                <Play size={14} fill="currentColor" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
