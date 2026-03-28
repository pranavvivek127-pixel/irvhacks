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

const CATEGORY_IMAGES = {
  nature: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/A_forest_glen_with_stream_and_two_cows%29_-_F.D._Briscoe_LCCN2016649125.jpg/400px-A_forest_glen_with_stream_and_two_cows%29_-_F.D._Briscoe_LCCN2016649125.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/A_naturalist%27s_sketch_book_%28Plate_57%29_BHL46158016.jpg/400px-A_naturalist%27s_sketch_book_%28Plate_57%29_BHL46158016.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/%22Mapou_Pear%22%2C_Brazil_LCCN2003663626.jpg/400px-%22Mapou_Pear%22%2C_Brazil_LCCN2003663626.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/%22Capivard_at_the_foot_of_a_Bananier%22_LCCN2003663628.jpg/400px-%22Capivard_at_the_foot_of_a_Bananier%22_LCCN2003663628.jpg',
  ],
  portrait: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/%27Bob_Shepherd%27_concentration_camp_portrait_drawing_by_Brian_Stonehouse.jpg/400px-%27Bob_Shepherd%27_concentration_camp_portrait_drawing_by_Brian_Stonehouse.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/2014-08-25-SimoneWeilCroquis-byTh.Rioult.jpg/400px-2014-08-25-SimoneWeilCroquis-byTh.Rioult.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Jean-Baptiste_de_Muyser.jpg/400px-Jean-Baptiste_de_Muyser.jpg',
  ],
  abstract: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Hilma_af_Klint_Svanen.jpg/400px-Hilma_af_Klint_Svanen.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Robert_Delaunay_-_Rythme%2C_Joie_de_vivre.jpg/400px-Robert_Delaunay_-_Rythme%2C_Joie_de_vivre.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/%22Afterglow%22_by_Ray_L._Burggraf%2C_2005.jpg/400px-%22Afterglow%22_by_Ray_L._Burggraf%2C_2005.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/%22Codes%22_Abstract_Watercolor_Painting_by_Bruce_Black_%282020%29.jpg/400px-%22Codes%22_Abstract_Watercolor_Painting_by_Bruce_Black_%282020%29.jpg',
  ],
  architecture: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Architectural_Drawing_of_a_Garden_MET_EG14.108.jpeg/400px-Architectural_Drawing_of_a_Garden_MET_EG14.108.jpeg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Architectural_drawing_001.png/400px-Architectural_drawing_001.png',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Aanzichten_bouwplan.PNG/400px-Aanzichten_bouwplan.PNG',
  ],
  fantasy: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/2013-01-31_Dragonfish-Restaurant_by-David-Revoy.jpg/400px-2013-01-31_Dragonfish-Restaurant_by-David-Revoy.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/A_dragon_-_The_Illuminated_Books_of_the_middle_ages_%281844-1849%29_-_BL.jpg/400px-A_dragon_-_The_Illuminated_Books_of_the_middle_ages_%281844-1849%29_-_BL.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/2022-10-28_Introduce-the-dragon-to-the-outside-world_by-David-Revoy.jpg/400px-2022-10-28_Introduce-the-dragon-to-the-outside-world_by-David-Revoy.jpg',
  ],
  'still life': [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/%22Still_life_with_lemon_and_honey%22.jpg/400px-%22Still_life_with_lemon_and_honey%22.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/%22Still_life_with_yellow_apple_and_honey%22.jpg/400px-%22Still_life_with_yellow_apple_and_honey%22.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Kalf%2C_Willem_-_Still_Life_with_Ewer%2C_Vessels_and_Pomegranate_-_Google_Art_Project.jpg/400px-Kalf%2C_Willem_-_Still_Life_with_Ewer%2C_Vessels_and_Pomegranate_-_Google_Art_Project.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/A_still_life_of_a_bird_and_fruit.jpg/400px-A_still_life_of_a_bird_and_fruit.jpg',
  ],
};

function getImageForSuggestion(category, index) {
  const pool = CATEGORY_IMAGES[category] || Object.values(CATEGORY_IMAGES).flat();
  return pool[index % pool.length];
}

export default function Suggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [images, setImages] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const navigate = useNavigate();

  const loadImages = (suggestionList) => {
    const map = {};
    suggestionList.forEach((s, i) => {
      map[s.id || i] = getImageForSuggestion(s.category, i);
    });
    setImages(map);
  };

  const loadSuggestions = async (cat) => {
    setIsLoading(true);
    setSuggestions([]);
    setImages({});
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat === 'all' ? null : cat })
      });
      const data = await res.json();
      if (data.suggestions) {
        setSuggestions(data.suggestions);
        loadImages(data.suggestions);
      }
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
    window.sessionStorage.setItem('artai_pending_topic', suggestion.title);
    navigate('/');
  };

  return (
    <div className="suggestions-page">
      <div className="suggestions-header">
        <div className="suggestions-title-row">
          <div>
            <h1 className="suggestions-title">Drawing Inspiration</h1>
            <p className="suggestions-subtitle">Browse AI-curated ideas with real art references</p>
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
                <div className="skeleton-image" />
                <div className="skeleton-line long" />
                <div className="skeleton-line short" />
                <div className="skeleton-badge" />
              </div>
            ))}
          </div>
        ) : (
          <div className="suggestions-grid">
            {suggestions.map((s, i) => {
              const imgKey = s.id || i;
              const imgUrl = images[imgKey];
              return (
                <div
                  key={imgKey}
                  className="suggestion-card fade-in"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {/* Reference image */}
                  <div className="suggestion-image">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={s.title}
                        onError={e => { e.target.parentNode.classList.add('no-image'); e.target.remove(); }}
                      />
                    ) : (
                      <div className="suggestion-image-placeholder">
                        <span>{s.emoji}</span>
                      </div>
                    )}
                    <span className={`badge badge-${s.difficulty} image-badge`}>{s.difficulty}</span>
                  </div>

                  <div className="suggestion-card-body">
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
                </div>
              );
            })}
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
