import React from 'react';
import './TodoList.css';

export default function TodoList({ todos, completedIds, onToggle, feedback, isAnalyzing }) {
  const [feedbackDismissed, setFeedbackDismissed] = React.useState(false);

  // Show feedback panel again when new feedback arrives
  React.useEffect(() => { if (feedback) setFeedbackDismissed(false); }, [feedback]);
  if (!todos || todos.length === 0) return null;

  const completedCount = todos.filter(t => completedIds.has(t.id)).length;
  const progress = Math.round((completedCount / todos.length) * 100);

  return (
    <div className="todo-list fade-in">
      <div className="todo-header">
        <div className="todo-progress-info">
          <span className="todo-progress-text">{completedCount}/{todos.length} steps</span>
          <span className="todo-progress-pct">{progress}%</span>
        </div>
        <div className="todo-progress-bar">
          <div className="todo-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="todo-steps">
        {todos.map(todo => {
          const isDone = completedIds.has(todo.id);
          return (
            <div key={todo.id} className={`todo-step ${isDone ? 'done' : ''}`}>
              <div className="todo-step-left">
                <div className="todo-check">
                  {isDone ? <CheckIcon /> : <span className="todo-num">{todo.id}</span>}
                </div>
              </div>
              <div className="todo-step-body">
                <div className="todo-step-title">{todo.title}</div>
                <div className="todo-step-desc">{todo.description}</div>
                {todo.color && (
                  <div className="todo-step-color">
                    <span
                      className="todo-color-dot"
                      style={{ background: todo.color.match(/#[0-9a-fA-F]{3,6}/)?.[0] || todo.color }}
                    />
                    <span className="todo-color-label">{todo.color}</span>
                  </div>
                )}
              </div>
              {!isDone && onToggle && (
                <button
                  className="todo-mark-btn"
                  onClick={() => onToggle(todo.id)}
                  title="Mark as complete"
                >
                  ✓
                </button>
              )}
            </div>
          );
        })}
      </div>

      {isAnalyzing && (
        <div className="feedback-analyzing">
          <div className="loading-spinner" />
          <span>Analyzing your drawing…</span>
        </div>
      )}

      {feedback && !isAnalyzing && !feedbackDismissed && (
        <div className="feedback-panel fade-in">
          {feedback.improvements && feedback.improvements.length > 0 && (
            <div className="feedback-section">
              <div className="feedback-label">
                <span>🔍</span> Areas to refine
                <button className="feedback-close" onClick={() => setFeedbackDismissed(true)} title="Dismiss">✕</button>
              </div>
              <ul className="feedback-list">
                {feedback.improvements.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {feedback.nextFocus && (
            <div className="feedback-next">
              <span>💡</span>
              <span>{feedback.nextFocus}</span>
            </div>
          )}
        </div>
      )}

      {completedCount === todos.length && todos.length > 0 && (
        <div className="todo-complete fade-in">
          <span>🎉</span> Drawing complete!
        </div>
      )}
    </div>
  );
}

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
