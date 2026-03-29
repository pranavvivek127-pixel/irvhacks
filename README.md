# StepCanvas

An AI-powered drawing studio that generates step-by-step drawing guides and automatically tracks your progress as you draw.

## Features

- **AI Drawing Guides** — Enter any topic and get a personalized step-by-step guide with color recommendations
- **Auto Progress Tracking** — After each stroke, the AI analyzes your canvas and checks off completed steps automatically
- **Full Drawing Toolkit** — Pen, Line, Curve, Shapes (rect, square, circle, ellipse, triangle, star), Fill bucket, and Eraser
- **Gallery** — All drawings are saved locally and viewable in the Gallery tab with progress stats
- **Continue Drawing** — Pick up any saved drawing right where you left off
- **Ideas Page** — Browse drawing inspiration by category with reference images
- **Shadow & Depth Step** — Optional guided shading step to give your drawing a 3D look

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **AI:** Anthropic Claude API (claude-opus-4-6)

## Getting Started

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/pranavvivek127-pixel/irvhacks.git
   cd irvhacks
   ```

2. Install dependencies for both client and server:
   ```bash
   npm run install:all
   ```

3. Add your Anthropic API key. In the `server/` directory, create a `.env` file:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

### Running Locally

Open two terminals:

**Terminal 1 — Backend (port 3001):**
```bash
npm run dev:server
```

**Terminal 2 — Frontend (port 5173):**
```bash
npm run dev:client
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

1. Go to the **Draw** tab and type what you want to draw (e.g. "a cherry blossom branch")
2. Click **Start Drawing** — the AI generates a step-by-step guide
3. Draw on the canvas — steps check off automatically as you complete them
4. Use **Check Progress** at any time to manually trigger an analysis
5. Save your drawing with the **Save** button — it appears in the **Gallery** tab
6. Browse the **Ideas** tab for inspiration

## Keyboard Shortcuts

| Key | Tool |
|-----|------|
| `P` | Pen |
| `L` | Line |
| `C` | Curve |
| `F` | Fill |
| `E` | Eraser |
| `Ctrl/Cmd + Z` | Undo |
