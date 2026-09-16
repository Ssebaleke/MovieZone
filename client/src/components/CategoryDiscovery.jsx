import React from 'react';

const GENRE_PILLS = [
  'All',
  'Action',
  'Comedy',
  'Drama',
  'Horror',
  'Romance',
  'Thriller',
  'Fantasy',
  'Anime',
  'K-Drama'
];

const TOPIC_CARDS = [
  {
    id: 'action-thriller',
    title: 'Action & Thriller',
    genreKey: 'Action',
    gradientClass: 'card-red',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop&q=80'
  },
  {
    id: 'k-drama',
    title: 'K-Drama',
    regionKey: 'kdrama',
    gradientClass: 'card-blue',
    posterUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&h=600&fit=crop&q=80'
  },
  {
    id: 'nollywood',
    title: 'Nollywood',
    vjKey: 'VJ Junior',
    gradientClass: 'card-green',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=600&fit=crop&q=80'
  },
  {
    id: 'romance',
    title: 'Romance',
    genreKey: 'Romance',
    gradientClass: 'card-purple',
    posterUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&h=600&fit=crop&q=80'
  },
  {
    id: 'c-drama',
    title: 'C-Drama',
    regionKey: 'cdrama',
    gradientClass: 'card-amber',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&h=600&fit=crop&q=80'
  }
];

export default function CategoryDiscovery({ onSelectPill, onSelectTopic, activeGenre = '' }) {
  const getActivePill = () => {
    if (!activeGenre) return 'All';
    if (activeGenre === 'kdrama') return 'K-Drama';
    if (activeGenre === 'anime') return 'Anime';
    return activeGenre;
  };

  const handlePillClick = (genre) => {
    if (onSelectPill) onSelectPill(genre);
  };

  const handleCardClick = (card) => {
    if (onSelectTopic) onSelectTopic(card);
  };

  const activePill = getActivePill();

  return (
    <section className="category-discovery-section">
      {/* Horizontal genre filter pills */}
      <div className="genre-pills-scroll-container">
        <div className="genre-pills-wrapper">
          {GENRE_PILLS.map((genre) => {
            return (
              <button
                key={genre}
                className={`genre-pill ${activePill.toLowerCase() === genre.toLowerCase() ? 'active' : ''}`}
                onClick={() => handlePillClick(genre)}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section Title Header */}
      <div className="discovery-header-row">
        <h2 className="discovery-title">What are you interested in?</h2>
        <button
          className="discovery-view-all"
          onClick={() => handlePillClick('All')}
        >
          View all &gt;
        </button>
      </div>

      {/* Category Cards Slider / Row */}
      <div className="topic-cards-scroll-container">
        <div className="topic-cards-grid">
          {TOPIC_CARDS.map((card) => (
            <div
              key={card.id}
              className={`topic-card ${card.gradientClass}`}
              onClick={() => handleCardClick(card)}
              role="button"
              tabIndex={0}
            >
              <div className="topic-card-content">
                <h3 className="topic-card-title">{card.title}</h3>
                <span className="topic-card-action">
                  View Topic <span className="arrow">&rarr;</span>
                </span>
              </div>
              <div className="topic-card-poster-wrapper">
                <img
                  src={card.posterUrl}
                  alt=""
                  className="topic-card-poster-img"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
