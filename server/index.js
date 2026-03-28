require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Generate step-by-step drawing todos for a given topic
app.post('/api/todos', async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'Topic required' });

  try {
    const stream = await client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are an expert art instructor. A student wants to draw: "${topic}"

Generate a clear, actionable step-by-step drawing guide with exactly 6-8 steps. Each step should be a specific, observable action the artist takes on the canvas.

Respond ONLY with a JSON array of steps. Each step has:
- "id": number (1-based)
- "title": short step name (3-5 words)
- "description": detailed instruction (1-2 sentences)
- "checkHint": what to look for visually to know this step is done (used for AI detection)

Example format:
[
  {
    "id": 1,
    "title": "Sketch basic shapes",
    "description": "Lightly sketch the main geometric shapes that form the subject using thin lines.",
    "checkHint": "Basic geometric shapes or outlines visible on canvas"
  }
]

Topic: "${topic}"`
      }]
    });

    const message = await stream.finalMessage();
    const text = message.content[0].text;

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON array in response');

    const todos = JSON.parse(jsonMatch[0]);
    res.json({ todos });
  } catch (err) {
    console.error('Error generating todos:', err);
    res.status(500).json({ error: err.message });
  }
});

// Analyze a drawing image and mark which steps appear complete
app.post('/api/analyze', async (req, res) => {
  const { imageBase64, todos, topic } = req.body;
  if (!imageBase64 || !todos) return res.status(400).json({ error: 'Image and todos required' });

  // Strip data URL prefix if present
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  try {
    const stepsText = todos.map(t => `Step ${t.id}: ${t.title} — ${t.checkHint}`).join('\n');

    const stream = await client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/png', data: base64Data }
          },
          {
            type: 'text',
            text: `You are an encouraging art instructor reviewing a student's drawing of "${topic}".

Here are the drawing steps to evaluate:
${stepsText}

EVALUATION RULES:
- Be GENEROUS. If you can see ANY marks, lines, shapes, or attempts related to a step, mark it complete.
- A rough sketch, partial outline, or even a few lines that suggest the element counts as complete.
- Only leave a step incomplete if there are truly zero marks on the canvas related to it.
- If there are visible marks on the canvas (not completely blank), credit the student for early steps.
- Re-evaluate ALL steps every time based on what is currently visible.

Respond ONLY with JSON:
{
  "completedSteps": [1, 2],
  "feedback": {
    "improvements": ["one encouragement or tip"],
    "nextFocus": "One specific next step to work on"
  }
}`
          }
        ]
      }]
    });

    const message = await stream.finalMessage();
    const text = message.content[0].text;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const result = JSON.parse(jsonMatch[0]);
    res.json(result);
  } catch (err) {
    console.error('Error analyzing drawing:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get drawing suggestions/inspiration
app.post('/api/suggestions', async (req, res) => {
  const { category } = req.body;

  try {
    const categoryPrompt = category
      ? `Focus on the category: "${category}".`
      : 'Cover a variety of styles and difficulties.';

    const stream = await client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are a creative art director inspiring artists. ${categoryPrompt}

Generate 9 unique, inspiring drawing prompts. Mix beginner, intermediate, and advanced subjects.

Respond ONLY with a JSON array:
[
  {
    "id": 1,
    "title": "Subject name",
    "description": "One evocative sentence describing what to capture",
    "difficulty": "beginner" | "intermediate" | "advanced",
    "category": "nature" | "portrait" | "abstract" | "architecture" | "fantasy" | "still life",
    "emoji": "relevant emoji"
  }
]`
      }]
    });

    const message = await stream.finalMessage();
    const text = message.content[0].text;

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON array in response');

    const suggestions = JSON.parse(jsonMatch[0]);
    res.json({ suggestions });
  } catch (err) {
    console.error('Error getting suggestions:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`ArtAI server running on port ${PORT}`));
