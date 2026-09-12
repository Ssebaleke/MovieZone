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
    <div className="profile-selection-bg">
      <div className="profile-prompt-container">
        <h1>{isManageMode ? 'Manage Profiles:' : "Who's watching?"}</h1>

        <div className="profiles-list">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="profile-wrapper"
              onClick={() => handleProfileSelect(profile)}
            >
              <div className="profile-avatar-container">
                <img src={profile.avatarUrl} alt={profile.name} />
                {isManageMode && (
                  <div className="profile-edit-badge">
                    <Edit2 size={36} color="#fff" />
                  </div>
                )}
              </div>
              <span className="profile-name">{profile.name}</span>
            </div>
          ))}

          {profiles.length < 5 && (
            <div className="profile-wrapper" onClick={handleOpenCreateModal}>
              <div className="profile-avatar-container" style={{ background: '#1c1c1c', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Plus size={64} color="#555" />
              </div>
              <span className="profile-name">Add Profile</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <button
            className="manage-profiles-btn"
            onClick={() => setIsManageMode(!isManageMode)}
          >
            {isManageMode ? 'Done' : 'Manage Profiles'}
          </button>
          
          <button
            className="manage-profiles-btn"
            style={{ background: '#333', borderColor: '#333' }}
            onClick={() => {
              localStorage.removeItem('netflix_token');
              localStorage.removeItem('netflix_user');
              navigate('/login');
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {showModal && (
        <div className="payment-modal-overlay">
          <div className="profile-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>{editingProfileId ? 'Edit Profile' : 'Add Profile'}</h2>
              <button style={{ background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => setShowModal(false)}>
                <X size={28} color="#fff" />
              </button>
            </div>

            {error && <div className="error-message" style={{ marginBottom: '15px' }}>{error}</div>}

            <form onSubmit={handleSaveProfile} className="profile-edit-form">
              <div className="profile-avatar-picker">
                <div className="profile-avatar-container" style={{ width: '100px', height: '100px' }}>
                  <img src={profileAvatar} alt="Current" />
                </div>
                <div className="avatar-previews-grid">
                  {DEFAULT_AVATARS.map((av, idx) => (
                    <div
                      key={idx}
                      className={`avatar-thumbnail ${profileAvatar === av ? 'selected' : ''}`}
                      onClick={() => setProfileAvatar(av)}
                    >
                      <img src={av} alt={`Option ${idx}`} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="profile-input-fields">
                <input
                  type="text"
                  placeholder="Name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  maxLength={15}
                  required
                />

                <div className="cc-input-container">
                  <label>Maturity Level</label>
                  <select value={maturityLimit} onChange={(e) => setMaturityLimit(e.target.value)}>
                    <option value="G">G (All ages)</option>
                    <option value="PG">PG (Parental Guidance)</option>
                    <option value="13+">13+ (Teens)</option>
                    <option value="R">R (Restricted)</option>
                    <option value="TV-MA">TV-MA (Adults Only)</option>
                  </select>
                </div>

                <div className="payment-actions" style={{ marginTop: '20px' }}>
                  <button type="submit" className="payment-confirm" disabled={loading}>
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  {editingProfileId && (
                    <button
                      type="button"
                      className="payment-cancel"
                      style={{ background: '#b80710', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      onClick={handleDeleteProfile}
                      disabled={loading}
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  )}
                  <button type="button" className="payment-cancel" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
