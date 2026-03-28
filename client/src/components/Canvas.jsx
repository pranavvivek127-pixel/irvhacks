import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import './Canvas.css';

const Canvas = forwardRef(({ tool, color, brushSize, onStroke }, ref) => {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef(null);
  const lineStartPos = useRef(null);
  const lineSnapshot = useRef(null);
  const history = useRef([]);
  const historyIndex = useRef(-1);

  useImperativeHandle(ref, () => ({
    getImageBase64: () => {
      const canvas = canvasRef.current;
      return canvas ? canvas.toDataURL('image/png') : null;
    },
    clear: () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      saveHistory();
    },
    undo: () => {
      if (historyIndex.current > 0) {
        historyIndex.current--;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = history.current[historyIndex.current];
        img.onload = () => ctx.drawImage(img, 0, 0);
      }
    }
  }));

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    history.current = history.current.slice(0, historyIndex.current + 1);
    history.current.push(canvas.toDataURL());
    historyIndex.current = history.current.length - 1;
    if (history.current.length > 50) {
      history.current.shift();
      historyIndex.current--;
    }
  }, []);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    if (w === 0 || h === 0) return;
    // Preserve existing drawing if canvas already has content
    const hadContent = history.current.length > 0 && historyIndex.current >= 0;
    const savedImg = hadContent ? history.current[historyIndex.current] : null;
    canvas.width = w;
    canvas.height = h;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    if (savedImg) {
      const img = new Image();
      img.src = savedImg;
      img.onload = () => ctx.drawImage(img, 0, 0, w, h);
    } else {
      history.current = [];
      historyIndex.current = -1;
      saveHistory();
    }
  }, [saveHistory]);

  useEffect(() => {
    // Use ResizeObserver so canvas initializes correctly even when revealed later
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        initCanvas();
      }
    });
    observer.observe(canvas);
    initCanvas();

    return () => observer.disconnect();
  }, [initCanvas]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    isDrawing.current = true;
    const canvas = canvasRef.current;
    const pos = getPos(e, canvas);
    lastPos.current = pos;

    if (tool === 'line') {
      lineStartPos.current = pos;
      lineSnapshot.current = canvas.toDataURL();
    } else {
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, (tool === 'eraser' ? brushSize * 2 : brushSize) / 2, 0, Math.PI * 2);
      ctx.fillStyle = tool === 'eraser' ? '#ffffff' : color;
      ctx.fill();
    }
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);

    if (tool === 'line') {
      // Restore snapshot then draw preview line
      const img = new Image();
      img.src = lineSnapshot.current;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        ctx.beginPath();
        ctx.moveTo(lineStartPos.current.x, lineStartPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.stroke();
      };
    } else {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      ctx.lineWidth = tool === 'eraser' ? brushSize * 2 : brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      lastPos.current = pos;
    }
  };

  const stopDraw = () => {
    if (isDrawing.current) {
      isDrawing.current = false;
      lastPos.current = null;
      lineStartPos.current = null;
      lineSnapshot.current = null;
      saveHistory();
      onStroke && onStroke();
    }
  };

  const getCursor = () => {
    if (tool === 'eraser') return 'cell';
    if (tool === 'line') return 'crosshair';
    return 'crosshair';
  };

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        style={{ cursor: getCursor() }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
    </div>
  );
});

Canvas.displayName = 'Canvas';
export default Canvas;
