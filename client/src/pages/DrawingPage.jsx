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
  const [shadowPrompt, setShadowPrompt] = useState(false);
  const [tool, setTool] = useState('pen');
  const [shape, setShape] = useState('rect');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [saveMsg, setSaveMsg] = useState('');
  const [lastAnalyzed, setLastAnalyzed] = useState(null);

  const canvasRef = useRef(null);
  const isAnalyzingRef = useRef(false);
  const todosRef = useRef([]);
  const topicRef = useRef('');
  const sessionIdRef = useRef(Date.now());
  const completedIdsRef = useRef(new Set());
  const navigate = useNavigate();

  // Keep refs in sync so interval/callbacks always have latest values
  useEffect(() => { todosRef.current = todos; }, [todos]);
  useEffect(() => { topicRef.current = topic; }, [topic]);
  useEffect(() => { isAnalyzingRef.current = isAnalyzing; }, [isAnalyzing]);
  useEffect(() => { completedIdsRef.current = completedIds; }, [completedIds]);

  // Auto-fill topic from suggestions page, or restore a saved drawing
  useEffect(() => {
    const continueTopic = window.sessionStorage.getItem('artai_continue_topic');
    const continueImage = window.sessionStorage.getItem('artai_continue_image');
    if (continueTopic) {
      window.sessionStorage.removeItem('artai_continue_topic');
      window.sessionStorage.removeItem('artai_continue_image');
      // Auto-submit the topic then restore the image once canvas is ready
      const t = continueTopic;
      setInputValue(t);
      setTopic(t);
      setIsLoadingTodos(true);
      sessionIdRef.current = Date.now();
      fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: t })
      })
        .then(r => r.json())
        .then(data => {
          if (data.todos) {
            setTodos(data.todos);
            setShadowPrompt(true);
            if (continueImage) {
              // Wait for canvas to be visible and sized, then load the image
              setTimeout(() => canvasRef.current?.loadImage(continueImage), 300);
            }
          }
        })
        .catch(console.error)
        .finally(() => setIsLoadingTodos(false));
      return;
    }
    const pending = window.sessionStorage.getItem('artai_pending_topic');
    if (pending) {
      setInputValue(pending);
      window.sessionStorage.removeItem('artai_pending_topic');
    }
  }, []);

  // Analyze immediately when the user releases the mouse/touch
  const handleStroke = useCallback(() => {
    if (!todosRef.current.length) return;
    if (!isAnalyzingRef.current) analyzeDrawing();
  }, []);

  const generateTodos = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const t = inputValue.trim();
    setTopic(t);
    setIsLoadingTodos(true);
    setTodos([]);
    setCompletedIds(new Set());
    setFeedback(null);
    sessionIdRef.current = Date.now();

    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: t })
      });
      const data = await res.json();
      if (data.todos) {
        setTodos(data.todos);
        setShadowPrompt(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingTodos(false);
    }
  };

const analyzeDrawing = useCallback(async () => {
    const currentTodos = todosRef.current;
    const currentTopic = topicRef.current;
    console.log('[analyze] called — todos:', currentTodos.length, 'topic:', currentTopic);
    if (!canvasRef.current || !currentTodos.length) {
      console.log('[analyze] skipped — no canvas or no todos');
      return;
    }
    const imageBase64 = canvasRef.current.getImageBase64();
    if (!imageBase64) {
      console.log('[analyze] skipped — no image');
      return;
    }
    console.log('[analyze] sending image, length:', imageBase64.length);

    setIsAnalyzing(true);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, todos: currentTodos, topic: currentTopic })
      });
      const data = await res.json();
      console.log('[analyze] API response:', data);
      console.log('[analyze] completedSteps raw:', data.completedSteps);
      console.log('[analyze] todos ids:', todosRef.current.map(t => t.id));
      const completed = new Set((data.completedSteps || []).map(Number));
      console.log('[analyze] completed Set:', [...completed]);
      // Merge with existing — never uncheck a step once marked done
      setCompletedIds(prev => new Set([...prev, ...completed]));
      if (data.feedback) setFeedback(data.feedback);
      setLastAnalyzed(new Date());

      // Auto-save after every analysis so progress is never lost
      const saveImage = canvasRef.current?.getImageBase64();
      if (saveImage) {
        const currentTodos = todosRef.current;
        const mergedCompleted = new Set([...completedIdsRef.current, ...completed]);
        const completedCount = currentTodos.filter(t => mergedCompleted.has(t.id)).length;
        const drawings = JSON.parse(localStorage.getItem('artai_drawings') || '[]');
        // Update existing entry for this session or add new one
        const existingIdx = drawings.findIndex(d => d.sessionId === sessionIdRef.current);
        const entry = {
          id: existingIdx >= 0 ? drawings[existingIdx].id : Date.now(),
          sessionId: sessionIdRef.current,
          topic: topicRef.current || 'Untitled',
          imageBase64: saveImage,
          date: new Date().toISOString(),
          steps: currentTodos.length,
          completedSteps: completedCount,
          progress: currentTodos.length > 0 ? Math.round((completedCount / currentTodos.length) * 100) : 0
        };
        if (existingIdx >= 0) drawings[existingIdx] = entry;
        else drawings.unshift(entry);
        localStorage.setItem('artai_drawings', JSON.stringify(drawings.slice(0, 50)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

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
      if (e.key === 'l') setTool('line');
      if (e.key === 'c') setTool('curve');
      if (e.key === 'f') setTool('fill');
      if (e.key === 'e') setTool('eraser');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const isActive = topic && todos.length > 0;

  const resetSession = () => {
    setTopic('');
    setInputValue('');
    setTodos([]);
    setCompletedIds(new Set());
    setFeedback(null);
    setLastAnalyzed(null);
    setShadowPrompt(false);
    canvasRef.current?.clear();
    sessionIdRef.current = Date.now();
  };

  const QUICK_SUGGESTIONS = [
    { label: '🌸 Cherry blossom', value: 'a cherry blossom branch' },
    { label: '🦁 Lion portrait', value: 'a lion portrait' },
    { label: '🏔️ Mountain sunset', value: 'a mountain sunset' },
    { label: '🐉 Dragon', value: 'a dragon' },
    { label: '🏠 Cozy cottage', value: 'a cozy cottage' },
    { label: '🐠 Tropical fish', value: 'a colorful tropical fish' },
    { label: '🌊 Ocean wave', value: 'a crashing ocean wave' },
    { label: '🦋 Butterfly', value: 'a butterfly on a flower' },
    { label: '🚀 Rocket', value: 'a rocket launching into space' },
    { label: '🍎 Still life', value: 'a still life with fruit and vase' },
  ];

  const pickSuggestion = (value) => {
    setInputValue(value);
  };

  const shadowStep = todos.find(t => t.isShadowStep);

  const handleShadowNo = () => {
    if (shadowStep) setCompletedIds(prev => new Set([...prev, shadowStep.id]));
    setShadowPrompt(false);
  };

  return (
    <div className="drawing-page">
      {/* Shadow 3D prompt modal */}
      {shadowPrompt && isActive && (
        <div className="shadow-modal-overlay">
          <div className="shadow-modal">
            <div className="shadow-modal-icon">🌑</div>
            <h3>Add shadows for a 3D effect?</h3>
            <p>The last step will guide you through shading to make your drawing look three-dimensional.</p>
            <div className="shadow-modal-actions">
              <button className="btn btn-primary" onClick={() => setShadowPrompt(false)}>
                Yes, I'll shade it
              </button>
              <button className="btn btn-secondary" onClick={handleShadowNo}>
                No thanks — mark done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Topic bar */}
      <div className="topic-bar">
        <form className="topic-form" onSubmit={generateTodos}>
          <div className="topic-input-wrap">
            <span className="topic-icon">🎨</span>
            <input
              className="topic-input"
              type="text"
              placeholder="What would you like to draw today?"
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
              <><div className="loading-spinner" /> Setting up…</>
            ) : (
              <><SparkleIcon /> Start Drawing</>
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
            <button className="btn btn-danger" onClick={resetSession} title="Start a new drawing">
              <ExitIcon /> New Topic
            </button>
          </div>
        )}
      </div>

      {/* Quick suggestions — only when no active session */}
      {!isActive && (
        <div className="quick-suggestions">
          {QUICK_SUGGESTIONS.map(s => (
            <button
              key={s.value}
              className="suggestion-chip"
              onClick={() => pickSuggestion(s.value)}
              type="button"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

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
              shape={shape} setShape={setShape}
              color={color} setColor={setColor}
              brushSize={brushSize} setBrushSize={setBrushSize}
              onUndo={() => canvasRef.current?.undo()}
              onClear={() => canvasRef.current?.clear()}
            />
            <Canvas
              ref={canvasRef}
              tool={tool}
              shape={shape}
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
                <span className={`pulse-dot ${isAnalyzing ? 'analyzing' : ''}`} />
                {isAnalyzing ? 'Analyzing…' : lastAnalyzed ? `Checked ${lastAnalyzed.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}` : 'Auto-tracking'}
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
                  onToggle={(id) => setCompletedIds(prev => new Set([...prev, id]))}
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

const ExitIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 12 7 8 3 4"/><line x1="7" y1="12" x2="21" y2="12"/><line x1="21" y1="4" x2="21" y2="20"/>
  </svg>
);
