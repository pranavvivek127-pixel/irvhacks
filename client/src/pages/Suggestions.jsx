import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Suggestions.css';

const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '✨' },
  { id: 'nature', label: 'Nature', emoji: '🌿' },
  { id: 'portrait', label: 'Portraits', emoji: '👤' },
  { id: 'abstract', label: 'Abstract', emoji: '🎨' },
  { id: 'architecture', label: 'Architecture', emoji: '🏛️' },
  { id: 'fantasy', label: 'Fantasy', emoji: '🐉' },
  { id: 'still life', label: 'Still Life', emoji: '🍎' },
];

export default function Suggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const navigate = useNavigate();

  const loadSuggestions = async (cat) => {
    setIsLoading(true);
    setSuggestions([]);
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat === 'all' ? null : cat })
      });
      const data = await res.json();
      if (data.suggestions) setSuggestions(data.suggestions);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions('all');
  }, []);

  const handleCategory = (cat) => {
    setActiveCategory(cat);
    loadSuggestions(cat);
  };

  const startDrawing = (suggestion) => {
    navigate('/', { state: { topic: suggestion.title } });
    window.sessionStorage.setItem('artai_pending_topic', suggestion.title);
  };

  return (
    <div className="suggestions-page">
      <div className="suggestions-header">
        <div className="suggestions-title-row">
          <div>
            <h1 className="suggestions-title">Drawing Inspiration</h1>
            <p className="suggestions-subtitle">Explore ideas and let AI guide your artistic journey</p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => loadSuggestions(activeCategory)}
            disabled={isLoading}
          >
            {isLoading ? <div className="loading-spinner" /> : <RefreshIcon />}
            {isLoading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
        <div className="category-tabs">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`cat-tab ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => handleCategory(cat.id)}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="suggestions-body">
        {isLoading ? (
          <div className="suggestions-loading">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="suggestion-skeleton">
                <div className="skeleton-emoji" />
                <div className="skeleton-line long" />
                <div className="skeleton-line short" />
                <div className="skeleton-badge" />
              </div>
            ))}
          </div>
        ) : (
          <div className="suggestions-grid">
            {suggestions.map((s, i) => (
              <div
                key={s.id || i}
                className="suggestion-card fade-in"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="suggestion-card-top">
                  <span className="suggestion-emoji">{s.emoji}</span>
                  <span className={`badge badge-${s.difficulty}`}>{s.difficulty}</span>
                </div>
                <h3 className="suggestion-name">{s.title}</h3>
                <p className="suggestion-desc">{s.description}</p>
                <div className="suggestion-footer">
                  <span className="suggestion-cat">
                    {CATEGORIES.find(c => c.id === s.category)?.emoji || '🎨'} {s.category}
                  </span>
                  <button
                    className="btn btn-primary suggestion-btn"
                    onClick={() => startDrawing(s)}
                  >
                    Draw This
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
  </svg>
);
