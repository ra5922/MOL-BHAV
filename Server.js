// Mol Bhav — local server (Root folder setup)
require('dotenv').config();
const express = require('express');
const path = require('path'); // Added for safe file paths

const app = express();
app.use(express.json());

// Serves ALL files (HTML, CSS, JS, IMAGES) from the current root folder
app.use(express.static(__dirname));

// Explicitly serve index.html when visiting http://localhost:3000/
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Groq API Proxy
app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GROQ_API_KEY. Add it to your .env file.' });
  }

  try {
    const { system, messages } = req.body;
    const groqMessages = [{ role: 'system', content: system }].concat(messages);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        max_completion_tokens: 300,
        reasoning_effort: 'low',
        messages: groqMessages
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Groq API error:', data);
      return res.status(response.status).json(data);
    }

    const text = (data.choices && data.choices[0] && data.choices[0].message)
      ? data.choices[0].message.content
      : '';
    res.json({ content: [{ text: text }] });
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Mol Bhav running — open http://localhost:${PORT}`);
});