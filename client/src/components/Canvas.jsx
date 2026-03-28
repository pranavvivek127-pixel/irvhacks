import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import './Canvas.css';

const Canvas = forwardRef(({ tool, shape, color, brushSize, onStroke }, ref) => {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef(null);
  const lineStartPos = useRef(null);
  const lineSnapshot = useRef(null);
  const curveEndPos = useRef(null);
  const curvePhase = useRef(0); // 0=idle 1=dragging end 2=bending
  const pendingImage = useRef(null);
  const history = useRef([]);
  const historyIndex = useRef(-1);

  useImperativeHandle(ref, () => ({
    getImageBase64: () => {
      const canvas = canvasRef.current;
      return canvas ? canvas.toDataURL('image/png') : null;
    },
    loadImage: (dataUrl) => {
      const canvas = canvasRef.current;
      if (!canvas) { pendingImage.current = dataUrl; return; }
      if (canvas.width === 0 || canvas.height === 0) { pendingImage.current = dataUrl; return; }
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        history.current = [];
        historyIndex.current = -1;
        history.current.push(canvas.toDataURL());
        historyIndex.current = 0;
      };
      img.src = dataUrl;
    },
    clear: () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveHistory();
    },
    undo: () => {
      if (historyIndex.current > 0) {
        historyIndex.current--;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = history.current[historyIndex.current];
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
    } else if (pendingImage.current) {
      const src = pendingImage.current;
      pendingImage.current = null;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        history.current = [];
        historyIndex.current = -1;
        history.current.push(canvas.toDataURL());
        historyIndex.current = 0;
      };
      img.src = src;
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

  const drawShape = useCallback((ctx, shapeType, x1, y1, x2, y2) => {
    const dx = x2 - x1, dy = y2 - y1;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    switch (shapeType) {
      case 'rect':
        ctx.strokeRect(x1, y1, dx, dy);
        break;
      case 'square': {
        const side = Math.min(Math.abs(dx), Math.abs(dy)) * (dx < 0 ? -1 : 1);
        ctx.strokeRect(x1, y1, side, side * (dy < 0 ? -1 : 1));
        break;
      }
      case 'circle': {
        const r = Math.min(Math.abs(dx), Math.abs(dy)) / 2;
        ctx.arc(x1 + r * (dx < 0 ? -1 : 1), y1 + r * (dy < 0 ? -1 : 1), r, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case 'ellipse': {
        const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
        ctx.ellipse(cx, cy, Math.abs(dx) / 2, Math.abs(dy) / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case 'triangle': {
        ctx.moveTo(x1 + dx / 2, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x1, y2);
        ctx.closePath();
        ctx.stroke();
        break;
      }
      case 'star': {
        const cx2 = (x1 + x2) / 2, cy2 = (y1 + y2) / 2;
        const outerR = Math.min(Math.abs(dx), Math.abs(dy)) / 2;
        const innerR = outerR * 0.4;
        for (let i = 0; i < 10; i++) {
          const angle = (Math.PI / 5) * i - Math.PI / 2;
          const r2 = i % 2 === 0 ? outerR : innerR;
          if (i === 0) ctx.moveTo(cx2 + r2 * Math.cos(angle), cy2 + r2 * Math.sin(angle));
          else ctx.lineTo(cx2 + r2 * Math.cos(angle), cy2 + r2 * Math.sin(angle));
        }
        ctx.closePath();
        ctx.stroke();
        break;
      }
      default:
        ctx.strokeRect(x1, y1, dx, dy);
    }
  }, [color, brushSize]);

  const drawCurvePreview = useCallback((canvas, ctrl) => {
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = lineSnapshot.current;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      ctx.beginPath();
      ctx.moveTo(lineStartPos.current.x, lineStartPos.current.y);
      ctx.quadraticCurveTo(ctrl.x, ctrl.y, curveEndPos.current.x, curveEndPos.current.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.stroke();
    };
  }, [color, brushSize]);

  const startDraw = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const pos = getPos(e, canvas);

    // Curve phase 2: clicking commits the curve
    if (tool === 'curve' && curvePhase.current === 2) {
      curvePhase.current = 0;
      const start = { ...lineStartPos.current };
      const end = { ...curveEndPos.current };
      const ctrl = { ...pos };
      curveEndPos.current = null;
      commitFromSnapshot((ctx) => {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.quadraticCurveTo(ctrl.x, ctrl.y, end.x, end.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.stroke();
      });
      return;
    }

    isDrawing.current = true;
    lastPos.current = pos;

    if (tool === 'line' || tool === 'curve' || tool === 'shape') {
      lineStartPos.current = pos;
      lineSnapshot.current = canvas.toDataURL();
      if (tool === 'curve') curvePhase.current = 1;
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
    const canvas = canvasRef.current;
    const pos = getPos(e, canvas);

    // Curve phase 2: mouse move bends the curve
    if (tool === 'curve' && curvePhase.current === 2) {
      drawCurvePreview(canvas, pos);
      return;
    }

    if (!isDrawing.current) return;
    const ctx = canvas.getContext('2d');

    if (tool === 'line') {
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
    } else if (tool === 'curve' || tool === 'shape') {
      // Preview while dragging
      const img = new Image();
      img.src = lineSnapshot.current;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        if (tool === 'shape') {
          drawShape(ctx, shape, lineStartPos.current.x, lineStartPos.current.y, pos.x, pos.y);
        } else {
          ctx.beginPath();
          ctx.moveTo(lineStartPos.current.x, lineStartPos.current.y);
          ctx.lineTo(pos.x, pos.y);
          ctx.strokeStyle = color;
          ctx.lineWidth = brushSize;
          ctx.lineCap = 'round';
          ctx.setLineDash([6, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      };
      lastPos.current = pos;
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

  const commitFromSnapshot = useCallback((drawFn) => {
    // Restore snapshot, run drawFn synchronously on top, then save history
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const snap = lineSnapshot.current;
    lineSnapshot.current = null;
    lineStartPos.current = null;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      drawFn(ctx);
      saveHistory();
      onStroke && onStroke();
    };
    img.src = snap;
  }, [saveHistory, onStroke]);

  const stopDraw = (e) => {
    if (tool === 'shape' && isDrawing.current) {
      isDrawing.current = false;
      const start = { ...lineStartPos.current };
      const end = { ...lastPos.current };
      const shapeType = shape;
      commitFromSnapshot((ctx) => drawShape(ctx, shapeType, start.x, start.y, end.x, end.y));
      return;
    }
    if (tool === 'line' && isDrawing.current) {
      isDrawing.current = false;
      const start = { ...lineStartPos.current };
      const end = { ...lastPos.current };
      commitFromSnapshot((ctx) => {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.stroke();
      });
      return;
    }
    if (tool === 'curve' && curvePhase.current === 1 && isDrawing.current) {
      // End of drag: fix the end point, enter bend phase
      const canvas = canvasRef.current;
      curveEndPos.current = { ...lastPos.current };
      isDrawing.current = false;
      curvePhase.current = 2;
      const midX = (lineStartPos.current.x + curveEndPos.current.x) / 2;
      const midY = (lineStartPos.current.y + curveEndPos.current.y) / 2;
      drawCurvePreview(canvas, { x: midX, y: midY });
      return;
    }
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
