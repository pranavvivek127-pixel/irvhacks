import React from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import DrawingPage from './pages/DrawingPage.jsx';
import PreviousDrawings from './pages/PreviousDrawings.jsx';
import Suggestions from './pages/Suggestions.jsx';
import './App.css';

export default function App() {
  const location = useLocation();

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">✦</span>
            <span className="logo-text">StepCanvas</span>
          </div>
          <nav className="nav">
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span>✏️</span> Draw
            </NavLink>
            <NavLink to="/gallery" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span>🖼️</span> Gallery
            </NavLink>
            <NavLink to="/suggestions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span>✨</span> Inspire
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={<DrawingPage />} />
          <Route path="/gallery" element={<PreviousDrawings />} />
          <Route path="/suggestions" element={<Suggestions />} />
        </Routes>
      </main>
    </div>
  );
}
