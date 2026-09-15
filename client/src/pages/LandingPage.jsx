import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, X, Play, Tv, Download, Users, Star, Zap } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: 'What is Movie Zone?',
    a: "Movie Zone is Uganda's premier streaming platform featuring blockbuster movies, series, K-Dramas, Nollywood, and Asian cinema translated by top local Video Jockeys (VJs) like VJ Junior, VJ Emmy, VJ Ice P, VJ Jingo, and VJ Mark."
  },
  {
    q: 'How much does Movie Zone cost?',
    a: 'Stream on your smartphone, Smart TV, tablet, or laptop for low fixed subscriptions paid via Mobile Money. No extra fees, no long contracts. Cancel anytime.'
  },
  {
    q: 'Where can I watch?',
    a: 'Watch anywhere, anytime. Sign in to your Movie Zone account to watch instantly on the web or on any internet-connected device — phone, tablet, laptop, or Smart TV.'
  },
  {
    q: 'Can I choose different VJ audio versions?',
    a: 'Yes! Movie Zone lets you select your favorite VJ audio version (VJ Junior, VJ Emmy, VJ Ice P, and more) directly on the movie details page and inside the player.'
  },
  {
    q: 'Is Movie Zone good for kids?',
    a: 'Yes. Kids profiles come with PIN-protected parental controls that let you restrict maturity ratings for family-friendly viewing.'
  }
];

const FEATURES = [
  {
    icon: <Tv size={36} />,
    title: 'Watch on Any Device',
    desc: 'Stream on your phone, tablet, laptop, or Smart TV. Your movies follow you everywhere.'
  },
  {
    icon: <Download size={36} />,
    title: 'Download & Watch Offline',
    desc: 'Save your favorite VJ movies and watch them without internet — perfect for on the go.'
  },
  {
    icon: <Users size={36} />,
    title: 'Multiple Profiles',
    desc: 'Create up to 5 profiles per account. Everyone in the family gets their own personalized feed.'
  },
  {
    icon: <Zap size={36} />,
    title: 'Sub-100ms Streaming',
    desc: 'Powered by Reelplexi CDN — ultra-fast African streaming with no buffering, no lag.'
  }
];

const VJS = [
  { name: 'VJ Junior', tag: 'Most Popular', color: '#e50914' },
  { name: 'VJ Emmy', tag: 'K-Drama King', color: '#ff6b35' },
  { name: 'VJ Ice P', tag: 'Action Specialist', color: '#4ecdc4' },
  { name: 'VJ Jingo', tag: 'Comedy Expert', color: '#ffe66d' },
  { name: 'VJ Mark', tag: 'Nollywood Pro', color: '#a8e6cf' },
];

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const navigate = useNavigate();

  const handleGetStarted = (e) => {
    e.preventDefault();
    if (!email) return;
    navigate('/login', { state: { email, signUp: true } });
  };

  return (
    <div className="lp-root">

      {/* NAV */}
      <header className="lp-nav">
        <img src="/movie-zone-logo.svg" alt="MovieZone" className="lp-logo" onClick={() => navigate('/')} />
        <button className="lp-signin-btn" onClick={() => navigate('/login')}>Sign In</button>
      </header>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-overlay" />
        <div className="lp-hero-content">
          <div className="lp-hero-badge"><Star size={13} fill="#e50914" color="#e50914" /> Uganda's #1 VJ Streaming Platform</div>
          <h1 className="lp-hero-title">
            Blockbusters. K-Dramas.<br />
            <span className="lp-red">In Your Language.</span>
          </h1>
          <p className="lp-hero-sub">
            Watch thousands of movies & series translated by Uganda's top VJs —<br className="lp-br" />
            VJ Junior, VJ Emmy, VJ Ice P, VJ Jingo & VJ Mark.
          </p>
          <form onSubmit={handleGetStarted} className="lp-email-form">
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="lp-email-input"
              required
            />
            <button type="submit" className="lp-cta-btn">
              Get Started <ChevronRight size={20} />
            </button>
          </form>
          <p className="lp-hero-hint">No commitments. Cancel anytime.</p>
        </div>
        <div className="lp-hero-scroll-hint">↓</div>
      </section>

      {/* DIVIDER */}
      <div className="lp-divider" />

      {/* FEATURES */}
      <section className="lp-features">
        <div className="lp-section-inner">
          <p className="lp-section-label">Why Movie Zone</p>
          <h2 className="lp-section-title">Everything you need to stream</h2>
          <div className="lp-features-grid">
            {FEATURES.map((f, i) => (
              <div className="lp-feature-card" key={i}>
                <div className="lp-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="lp-divider" />

      {/* VJ SHOWCASE */}
      <section className="lp-vj-section">
        <div className="lp-section-inner">
          <p className="lp-section-label">Our VJ Lineup</p>
          <h2 className="lp-section-title">Choose your favorite voice</h2>
          <p className="lp-section-sub">Every movie is available in multiple VJ audio tracks. Switch anytime inside the player.</p>
          <div className="lp-vj-grid">
            {VJS.map((vj, i) => (
              <div className="lp-vj-card" key={i}>
                <div className="lp-vj-avatar" style={{ borderColor: vj.color }}>
                  <span>{vj.name.split(' ')[1][0]}</span>
                </div>
                <div className="lp-vj-name">{vj.name}</div>
                <div className="lp-vj-tag" style={{ color: vj.color }}>{vj.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="lp-divider" />

      {/* CTA BANNER */}
      <section className="lp-cta-banner">
        <div className="lp-cta-banner-inner">
          <h2>Ready to watch?</h2>
          <p>Enter your email to create or restart your membership.</p>
          <form onSubmit={handleGetStarted} className="lp-email-form lp-email-form--center">
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="lp-email-input"
              required
            />
            <button type="submit" className="lp-cta-btn">
              Get Started <ChevronRight size={20} />
            </button>
          </form>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="lp-divider" />

      {/* FAQ */}
      <section className="lp-faq">
        <div className="lp-section-inner lp-faq-inner">
          <h2 className="lp-section-title" style={{ textAlign: 'center' }}>Frequently Asked Questions</h2>
          <div className="lp-faq-list">
            {FAQ_ITEMS.map((item, idx) => (
              <div className="lp-faq-item" key={idx}>
                <button className="lp-faq-q" onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                  <span>{item.q}</span>
                  {openFaq === idx ? <X size={24} /> : <Plus size={24} />}
                </button>
                <div className={`lp-faq-a ${openFaq === idx ? 'lp-faq-a--open' : ''}`}>
                  <p>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <p className="lp-footer-copy">© {new Date().getFullYear()} Movie Zone Uganda. All rights reserved.</p>
          <div className="lp-footer-links">
            <span onClick={() => navigate('/login')}>Sign In</span>
            <span onClick={() => navigate('/signup')}>Sign Up</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
