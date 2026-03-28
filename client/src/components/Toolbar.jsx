import React, { useState } from 'react';
import './Toolbar.css';

const SHAPES = [
  { id: 'rect',     label: 'Rectangle' },
  { id: 'square',   label: 'Square'    },
  { id: 'circle',   label: 'Circle'    },
  { id: 'ellipse',  label: 'Ellipse'   },
  { id: 'triangle', label: 'Triangle'  },
  { id: 'star',     label: 'Star'      },
];

const COLORS = [
  '#000000', '#1a1a1a', '#4a4a4a', '#888888',
  '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#10b981', '#06b6d4', '#3b82f6', '#6366f1',
  '#8b5cf6', '#d946ef', '#f43f5e', '#ffffff',
];

const BRUSH_SIZES = [2, 5, 10, 18, 28];

export default function Toolbar({ tool, setTool, shape, setShape, color, setColor, brushSize, setBrushSize, onUndo, onClear }) {
  const [shapesOpen, setShapesOpen] = useState(false);
  const isShape = tool === 'shape';

  return (
    <div className="toolbar">

      {/* Pen, Line, Curve, Shapes & Eraser */}
      <div className="toolbar-group">
        <button
          className={`tool-btn-labeled ${tool === 'pen' ? 'active' : ''}`}
          onClick={() => setTool('pen')}
        >
          <PenIcon /> Pen
        </button>
        <button
          className={`tool-btn-labeled ${tool === 'line' ? 'active' : ''}`}
          onClick={() => setTool('line')}
        >
          <LineIcon /> Line
        </button>
        <button
          className={`tool-btn-labeled ${tool === 'curve' ? 'active' : ''}`}
          onClick={() => setTool('curve')}
        >
          <CurveIcon /> Curve
        </button>

        {/* Shapes with dropdown */}
        <div className="shape-picker-wrap">
          <button
            className={`tool-btn-labeled ${isShape ? 'active' : ''}`}
            onClick={() => { setTool('shape'); setShapesOpen(o => !o); }}
          >
            <ShapeIcon /> Shapes
          </button>
          {shapesOpen && (
            <div className="shape-dropdown">
              {SHAPES.map(s => (
                <button
                  key={s.id}
                  className={`shape-option ${shape === s.id ? 'active' : ''}`}
                  onClick={() => { setShape(s.id); setShapesOpen(false); setTool('shape'); }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className={`tool-btn-labeled ${tool === 'eraser' ? 'active eraser' : ''}`}
          onClick={() => setTool('eraser')}
        >
          <EraserIcon /> Eraser
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Undo & Clear — large labeled buttons */}
      <div className="toolbar-group">
        <button className="tool-btn-labeled" onClick={onUndo}>
          <UndoIcon /> Undo
        </button>
        <button className="tool-btn-labeled danger" onClick={onClear}>
          <TrashIcon /> Clear
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Colors */}
      <div className="toolbar-group colors-group">
        {COLORS.map(c => (
          <button
            key={c}
            className={`color-btn ${color === c ? 'active' : ''}`}
            style={{ background: c, border: c === '#ffffff' ? '1px solid #ccc' : 'none' }}
            onClick={() => { setColor(c); setTool('pen'); }}
            title={c}
          />
        ))}
        <label className="color-custom" title="Custom color">
          <input
            type="color"
            value={color}
            onChange={e => { setColor(e.target.value); setTool('pen'); }}
          />
          <GradientIcon />
        </label>
      </div>

      <div className="toolbar-divider" />

      {/* Brush sizes */}
      <div className="toolbar-group">
        {BRUSH_SIZES.map(size => (
          <button
            key={size}
            className={`size-btn ${brushSize === size ? 'active' : ''}`}
            onClick={() => setBrushSize(size)}
            title={`${size}px`}
          >
            <span
              className="size-dot"
              style={{
                width: Math.min(size, 20) + 'px',
                height: Math.min(size, 20) + 'px',
                background: color
              }}
            />
          </button>
        ))}
      </div>

    </div>
  );
}

const PenIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>
  </svg>
);

const ShapeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="8" height="8"/><circle cx="17" cy="7" r="4"/><polygon points="3,21 11,21 7,14"/>
  </svg>
);

const LineIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="19" x2="19" y2="5"/>
  </svg>
);

const CurveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19 Q12 4 20 19"/>
  </svg>
);

const EraserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 20H7L3 16l13-13 6 6-2 11z"/><path d="M6.0001 15.0001l2.9999 3.0001"/>
  </svg>
);

const UndoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);

const GradientIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/><path d="M12 22H6.5a4.5 4.5 0 01-4.5-4.5v0a4.5 4.5 0 014.5-4.5H12a4.5 4.5 0 014.5 4.5v0a4.5 4.5 0 01-4.5 4.5z"/>
  </svg>
);
