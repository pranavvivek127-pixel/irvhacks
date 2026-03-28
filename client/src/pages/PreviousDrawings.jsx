import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PreviousDrawings.css';

export default function PreviousDrawings() {
  const [drawings, setDrawings] = useState([]);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('artai_drawings') || '[]');
    setDrawings(saved);
  }, []);

  const deleteDrawing = (id, e) => {
    e.stopPropagation();
    const updated = drawings.filter(d => d.id !== id);
    setDrawings(updated);
    localStorage.setItem('artai_drawings', JSON.stringify(updated));
    if (selected?.id === id) setSelected(null);
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (drawings.length === 0) {
    return (
      <div className="gallery-empty">
        <div className="gallery-empty-content">
          <div className="gallery-empty-icon">🖼️</div>
          <h2>No drawings yet</h2>
          <p>Start drawing and save your artwork to see it here</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Start Drawing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-page">
      <div className="gallery-sidebar">
        <div className="gallery-header">
          <h2 className="gallery-title">Your Gallery</h2>
          <span className="gallery-count">{drawings.length} drawing{drawings.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="gallery-grid">
          {drawings.map(drawing => (
            <div
              key={drawing.id}
              className={`gallery-card ${selected?.id === drawing.id ? 'active' : ''}`}
              onClick={() => setSelected(drawing)}
            >
              <div className="gallery-thumb">
                <img src={drawing.imageBase64} alt={drawing.topic} />
                <button
                  className="gallery-delete"
                  onClick={(e) => deleteDrawing(drawing.id, e)}
                  title="Delete"
                >
                  <TrashIcon />
                </button>
              </div>
              <div className="gallery-card-info">
                <div className="gallery-card-topic">{drawing.topic}</div>
                <div className="gallery-card-meta">
                  <span>{formatDate(drawing.date)}</span>
                  {drawing.steps > 0 && (
                    <span className={`gallery-progress-badge ${drawing.progress === 100 ? 'complete' : ''}`}>
                      {drawing.progress}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected ? (
        <div className="gallery-preview fade-in">
          <div className="preview-header">
            <div>
              <div className="preview-label">Drawing</div>
              <h2 className="preview-topic">{selected.topic}</h2>
            </div>
            <div className="preview-meta">
              <span>{formatDate(selected.date)}</span>
              {selected.steps > 0 && (
                <div className="preview-progress">
                  <div className="preview-progress-bar">
                    <div
                      className="preview-progress-fill"
                      style={{ width: `${selected.progress}%` }}
                    />
                  </div>
                  <span>{selected.completedSteps}/{selected.steps} steps · {selected.progress}%</span>
                </div>
              )}
            </div>
          </div>
          <div className="preview-canvas">
            <img src={selected.imageBase64} alt={selected.topic} />
          </div>
          <div className="preview-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate('/')}
            >
              Continue Drawing
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                const a = document.createElement('a');
                a.href = selected.imageBase64;
                a.download = `${selected.topic.replace(/\s+/g, '-')}.png`;
                a.click();
              }}
            >
              <DownloadIcon /> Download
            </button>
          </div>
        </div>
      ) : (
        <div className="gallery-no-selection">
          <span>👈</span>
          <p>Select a drawing to preview</p>
        </div>
      )}
    </div>
  );
}

const TrashIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
