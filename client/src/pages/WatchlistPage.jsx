import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MovieCard from '../components/MovieCard';
import DetailModal from '../components/DetailModal';
import VideoPlayer from '../components/VideoPlayer';
import { api } from '../utils/api';

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [activePlayMovie, setActivePlayMovie] = useState(null);
  const navigate = useNavigate();

  const currentProfile = JSON.parse(localStorage.getItem('netflix_profile'));

  const fetchWatchlist = async () => {
    try {
      if (!currentProfile) {
        navigate('/profiles');
        return;
      }
      const list = await api.get(`/mylist/${currentProfile.id}`);
      setWatchlist(list);
    } catch (err) {
      console.error('Error fetching watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleToggleWatchlist = async (movie) => {
    if (!currentProfile) return;
    try {
      await api.delete('/mylist', { profileId: currentProfile.id, movieId: movie.id });
      setWatchlist(prev => prev.filter(m => m.id !== movie.id));
    } catch (err) {
      console.error('Error removing from watchlist:', err);
    }
  };

  return (
    <div className="browse-container">
      <Navbar />

      <div style={{ padding: '120px 4% 60px 4%', minHeight: '80vh' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '24px' }}>My List</h2>

        {loading ? (
          <div style={{ color: '#aaa' }}>Loading your list...</div>
        ) : watchlist.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '40px 10px' }}>
            {watchlist.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onPlay={setActivePlayMovie}
                onOpenModal={setSelectedMovie}
                isInWatchlist={true}
                onToggleWatchlist={handleToggleWatchlist}
              />
            ))}
          </div>
        ) : (
          <div style={{ color: '#aaa', padding: '40px 0', textAlign: 'center' }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '15px' }}>You haven't added any titles to your list yet.</p>
            <button className="auth-btn" onClick={() => navigate('/browse')}>Browse Movies</button>
          </div>
        )}
      </div>

      {selectedMovie && (
        <DetailModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onPlay={setActivePlayMovie}
          watchlist={watchlist}
          onToggleWatchlist={handleToggleWatchlist}
        />
      )}

      {activePlayMovie && (
        <VideoPlayer
          movie={activePlayMovie}
          onClose={() => {
            setActivePlayMovie(null);
            fetchWatchlist();
          }}
        />
      )}
    </div>
  );
}
