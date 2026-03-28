import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Canvas from '../components/Canvas.jsx';
import Toolbar from '../components/Toolbar.jsx';
import TodoList from '../components/TodoList.jsx';
import './DrawingPage.css';

export default function DrawingPage() {
  const [topic, setTopic] = useState('');
  const [inputValue, setInputValue] = useState('');
  const location = useLocation();
  const [todos, setTodos] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [feedback, setFeedback] = useState(null);
  const [isLoadingTodos, setIsLoadingTodos] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [strokeCount, setStrokeCount] = useState(0);
  const [saveMsg, setSaveMsg] = useState('');

  const canvasRef = useRef(null);
  const analyzeTimer = useRef(null);
  const navigate = useNavigate();

  // Auto-fill topic from suggestions page
  useEffect(() => {
    const pending = window.sessionStorage.getItem('artai_pending_topic');
    if (pending) {
      setInputValue(pending);
      window.sessionStorage.removeItem('artai_pending_topic');
    }
  }, []);

  // Auto-analyze after 5 strokes
  const handleStroke = useCallback(() => {
    setStrokeCount(prev => {
      const next = prev + 1;
      if (next % 5 === 0 && todos.length > 0) {
        clearTimeout(analyzeTimer.current);
        analyzeTimer.current = setTimeout(() => {
          analyzeDrawing();
        }, 800);
      }
      return next;
    });
  }, [todos]);

  const generateTodos = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const t = inputValue.trim();
    setTopic(t);
    setIsLoadingTodos(true);
    setTodos([]);
    setCompletedIds(new Set());
    setFeedback(null);
    setStrokeCount(0);

    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: t })
      });
      const data = await res.json();
      if (data.todos) setTodos(data.todos);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingTodos(false);
    }
  };

  const analyzeDrawing = useCallback(async () => {
    if (!canvasRef.current || !todos.length) return;
    const imageBase64 = canvasRef.current.getImageBase64();
    if (!imageBase64) return;

    setIsAnalyzing(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, todos, topic })
      });
      const data = await res.json();
      if (data.completedSteps) {
        setCompletedIds(new Set(data.completedSteps));
      }
      if (data.feedback) {
        setFeedback(data.feedback);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [todos, topic]);

  const saveDrawing = () => {
    if (!canvasRef.current) return;
    const imageBase64 = canvasRef.current.getImageBase64();
    if (!imageBase64) return;

    const drawings = JSON.parse(localStorage.getItem('artai_drawings') || '[]');
    const completedCount = todos.filter(t => completedIds.has(t.id)).length;
    drawings.unshift({
      id: Date.now(),
      topic: topic || 'Untitled',
      imageBase64,
      date: new Date().toISOString(),
      steps: todos.length,
      completedSteps: completedCount,
      progress: todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0
    });
    localStorage.setItem('artai_drawings', JSON.stringify(drawings.slice(0, 50)));
    setSaveMsg('Saved!');
    setTimeout(() => setSaveMsg(''), 2000);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        canvasRef.current?.undo();
      }
      if (e.key === 'p') setTool('pen');
      if (e.key === 'e') setTool('eraser');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const isActive = topic && todos.length > 0;

  return (
    <div className="drawing-page">
      {/* Topic bar */}
      <div className="topic-bar">
        <form className="topic-form" onSubmit={generateTodos}>
          <div className="topic-input-wrap">
            <span className="topic-icon">🎨</span>
            <input
              className="topic-input"
              type="text"
              placeholder="What do you want to draw? (e.g. a red maple leaf, a sunset over mountains)"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoadingTodos || !inputValue.trim()}
          >
            {isLoadingTodos ? (
              <><div className="loading-spinner" /> Generating…</>
            ) : (
              <><SparkleIcon /> Get Steps</>
            )}
          </button>
        </form>
        {isActive && (
          <div className="topic-actions">
            <button
              className="btn btn-secondary"
              onClick={analyzeDrawing}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <><div className="loading-spinner" /> Analyzing…</>
              ) : (
                <><EyeIcon /> Check Progress</>
              )}
            </button>
            <button className="btn btn-secondary" onClick={saveDrawing}>
              <SaveIcon /> {saveMsg || 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Main area */}
      <div className="drawing-layout">
        {/* Canvas area */}
        <div className="canvas-area">
          {!isActive && (
            <div className="canvas-empty">
              <div className="canvas-empty-content">
                <div className="canvas-empty-icon">✏️</div>
                <h2>Enter a topic above to begin</h2>
                <p>The AI will create a step-by-step drawing guide<br />and automatically track your progress</p>
              </div>
            </div>
          )}
          <div className={`canvas-container ${!isActive ? 'hidden' : ''}`}>
            <Toolbar
              tool={tool} setTool={setTool}
              color={color} setColor={setColor}
              brushSize={brushSize} setBrushSize={setBrushSize}
              onUndo={() => canvasRef.current?.undo()}
              onClear={() => canvasRef.current?.clear()}
            />
            <Canvas
              ref={canvasRef}
              tool={tool}
              color={color}
              brushSize={brushSize}
              onStroke={handleStroke}
            />
          </div>
        </div>

        {/* Sidebar */}
        {isActive && (
          <div className="sidebar fade-in">
            <div className="sidebar-header">
              <div className="sidebar-topic">
                <span className="sidebar-label">Drawing</span>
                <h3 className="sidebar-title">{topic}</h3>
              </div>
              <div className="auto-analyze-badge">
                <span className="pulse-dot" />
                Auto-tracking
              </div>
            </div>

            <div className="sidebar-body">
              {isLoadingTodos ? (
                <div className="sidebar-loading">
                  <div className="loading-spinner" />
                  <span>Creating your drawing guide…</span>
                </div>
              ) : (
                <TodoList
                  todos={todos}
                  completedIds={completedIds}
                  feedback={feedback}
                  isAnalyzing={isAnalyzing}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const SparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const SaveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);
