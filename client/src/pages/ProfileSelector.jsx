import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Plus, Trash2, X } from 'lucide-react';
import { api } from '../utils/api';

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80'
];

export default function ProfileSelector() {
  const [profiles, setProfiles] = useState([]);
  const [isManageMode, setIsManageMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Profile Form state
  const [editingProfileId, setEditingProfileId] = useState(null); // null means "Create Mode"
  const [profileName, setProfileName] = useState('');
  const [profileAvatar, setProfileAvatar] = useState(DEFAULT_AVATARS[0]);
  const [maturityLimit, setMaturityLimit] = useState('13+');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const fetchProfiles = async () => {
    try {
      const data = await api.get('/profiles');
      setProfiles(data);
    } catch (err) {
      console.error('Error fetching profiles:', err);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleProfileSelect = (profile) => {
    if (isManageMode) {
      // Edit the profile
      setEditingProfileId(profile.id);
      setProfileName(profile.name);
      setProfileAvatar(profile.avatarUrl);
      setMaturityLimit(profile.maturityLimit);
      setShowModal(true);
    } else {
      // Select profile and route to browse
      localStorage.setItem('netflix_profile', JSON.stringify(profile));
      navigate('/browse');
    }
  };

  const handleOpenCreateModal = () => {
    setEditingProfileId(null);
    setProfileName('');
    setProfileAvatar(DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)]);
    setMaturityLimit('13+');
    setShowModal(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) return;

    setError('');
    setLoading(true);

    try {
      if (editingProfileId) {
        // Update profile
        await api.put(`/profiles/${editingProfileId}`, {
          name: profileName,
          avatarUrl: profileAvatar,
          maturityLimit
        });
      } else {
        // Create profile
        await api.post('/profiles', {
          name: profileName,
          avatarUrl: profileAvatar,
          maturityLimit
        });
      }
      
      await fetchProfiles();
      setShowModal(false);
    } catch (err) {
      setError(err.message || 'Error saving profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!editingProfileId) return;
    setError('');
    setLoading(true);

    try {
      await api.delete(`/profiles/${editingProfileId}`);
      await fetchProfiles();
      setShowModal(false);
    } catch (err) {
      setError(err.message || 'Error deleting profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ps-bg">
      {/* Cinematic background blobs */}
      <div className="ps-bg-blob ps-bg-blob-1" />
      <div className="ps-bg-blob ps-bg-blob-2" />

      <div className="ps-container">
        {/* Logo */}
        <div className="ps-logo">
          <span className="brand-gradient-text" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', letterSpacing: '2px' }}>MOVIEZONE</span>
        </div>

        <h1 className="ps-heading">
          {isManageMode ? 'Manage Profiles' : "Who's watching?"}
        </h1>
        <p className="ps-subheading">
          {isManageMode ? 'Select a profile to edit or delete it' : 'Select your profile to continue'}
        </p>

        {/* Profile grid */}
        <div className="ps-profiles-grid">
          {profiles.map((profile) => (
            <div key={profile.id} className="ps-profile-card" onClick={() => handleProfileSelect(profile)}>
              <div className={`ps-avatar-ring ${isManageMode ? 'ps-avatar-ring--manage' : ''}`}>
                <img src={profile.avatarUrl} alt={profile.name} className="ps-avatar-img" />
                {isManageMode && (
                  <div className="ps-edit-overlay">
                    <Edit2 size={28} color="#fff" />
                  </div>
                )}
              </div>
              <span className="ps-profile-name">{profile.name}</span>
              {isManageMode && <span className="ps-edit-hint">Edit</span>}
            </div>
          ))}

          {profiles.length < 5 && (
            <div className="ps-profile-card" onClick={handleOpenCreateModal}>
              <div className="ps-avatar-ring ps-avatar-ring--add">
                <Plus size={40} color="#666" />
              </div>
              <span className="ps-profile-name">Add Profile</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="ps-actions">
          <button className="ps-btn ps-btn--outline" onClick={() => setIsManageMode(!isManageMode)}>
            {isManageMode ? 'Done' : 'Manage Profiles'}
          </button>
          <button className="ps-btn ps-btn--ghost" onClick={() => {
            localStorage.removeItem('netflix_token');
            localStorage.removeItem('netflix_user');
            navigate('/login');
          }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Edit / Create Modal */}
      {showModal && (
        <div className="ps-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="ps-modal">
            <div className="ps-modal-header">
              <h2 className="ps-modal-title">{editingProfileId ? 'Edit Profile' : 'New Profile'}</h2>
              <button className="ps-modal-close" onClick={() => setShowModal(false)}>
                <X size={22} color="#fff" />
              </button>
            </div>

            {error && <p className="error-message" style={{ marginBottom: 12 }}>{error}</p>}

            <form onSubmit={handleSaveProfile}>
              {/* Avatar section */}
              <div className="ps-modal-avatar-section">
                <div className="ps-modal-current-avatar">
                  <img src={profileAvatar} alt="Selected" />
                  <div className="ps-modal-avatar-label">Tap to change</div>
                </div>
                <div className="ps-modal-avatar-grid">
                  {DEFAULT_AVATARS.map((av, idx) => (
                    <div
                      key={idx}
                      className={`ps-avatar-option ${profileAvatar === av ? 'ps-avatar-option--active' : ''}`}
                      onClick={() => setProfileAvatar(av)}
                    >
                      <img src={av} alt={`Avatar ${idx + 1}`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Fields */}
              <div className="ps-modal-fields">
                <div className="ps-field">
                  <label className="ps-field-label">Display Name</label>
                  <input
                    className="ps-field-input"
                    type="text"
                    placeholder="e.g. John"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    maxLength={15}
                    required
                  />
                </div>

                <div className="ps-field">
                  <label className="ps-field-label">Maturity Level</label>
                  <select className="ps-field-input" value={maturityLimit} onChange={(e) => setMaturityLimit(e.target.value)}>
                    <option value="G">G — All ages</option>
                    <option value="PG">PG — Parental Guidance</option>
                    <option value="13+">13+ — Teens</option>
                    <option value="R">R — Restricted</option>
                    <option value="TV-MA">TV-MA — Adults Only</option>
                  </select>
                </div>
              </div>

              {/* Modal actions */}
              <div className="ps-modal-actions">
                <button type="submit" className="ps-btn ps-btn--primary" disabled={loading}>
                  {loading ? 'Saving…' : 'Save Profile'}
                </button>
                {editingProfileId && (
                  <button
                    type="button"
                    className="ps-btn ps-btn--danger"
                    onClick={handleDeleteProfile}
                    disabled={loading}
                  >
                    <Trash2 size={15} /> Delete
                  </button>
                )}
                <button type="button" className="ps-btn ps-btn--ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
