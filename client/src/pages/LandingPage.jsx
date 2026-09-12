import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, X } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: 'What is Movie Zone?',
    a: 'Movie Zone is Uganda\'s premier streaming platform featuring blockbuster movies, series, K-Dramas, Nollywood, and Asian cinema translated by top local Video Jockeys (VJs) like VJ Junior, VJ Emmy, VJ Ice P, VJ Jingo, and VJ Mark.'
  },
  {
    q: 'How much does Movie Zone cost?',
    a: 'Stream on your smartphone, Smart TV, tablet, or laptop for low fixed monthly subscriptions or Mobile Money payment. No extra fees, no long contracts.'
  },
  {
    q: 'Where can I watch?',
    a: 'Watch anywhere, anytime. Sign in to your Movie Zone account to watch instantly on the web or on any internet-connected device.'
  },
  {
    q: 'Can I choose different VJ audio versions?',
    a: 'Yes! Movie Zone allows you to select your favorite VJ audio version (VJ Junior, VJ Emmy, VJ Ice P, etc.) directly on movie details and inside the player.'
  },
  {
    q: 'Is Movie Zone good for kids?',
    a: 'Yes, kids profiles come with PIN-protected parental controls that let you restrict maturity ratings for family-friendly viewing.'
  }
];

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const navigate = useNavigate();

  const handleGetStarted = (e) => {
    e.preventDefault();
    if (!email) return;
    navigate('/login', { state: { email } });
  };

  const toggleFaq = (index) => {
    if (openFaq === index) {
      setOpenFaq(null);
    } else {
      setOpenFaq(index);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-header">
        <div className="logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src="/movie-zone-logo.svg" alt="Movie Zone" style={{ height: '42px', width: 'auto' }} />
        </div>
        <button className="auth-btn" onClick={() => navigate('/login')}>Sign In</button>
      </div>

      <div className="landing-hero">
        <h1>Ugandan VJs, Blockbuster Movies & K-Dramas</h1>
        <h2>Watch VJ Junior, VJ Emmy, VJ Ice P, VJ Jingo, VJ Mark & More.</h2>
        <p>Ready to watch? Enter your email to create or restart your membership.</p>
        
        <form onSubmit={handleGetStarted} className="email-signup-form">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" style={{ background: '#e50914' }}>
            Get Started <ChevronRight size={24} />
          </button>
        </form>
      </div>

      <div className="faq-section">
        <div className="faq-container">
          <h2>Frequently Asked Questions</h2>
          {FAQ_ITEMS.map((item, idx) => (
            <div className="faq-item" key={idx}>
              <div className="faq-question" onClick={() => toggleFaq(idx)}>
                <span>{item.q}</span>
                {openFaq === idx ? <X size={28} /> : <Plus size={28} />}
              </div>
              <div className={`faq-answer ${openFaq === idx ? 'open' : ''}`}>
                <p>{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
