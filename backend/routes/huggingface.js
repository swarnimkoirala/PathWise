const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');

// JWT middleware
const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Failed to authenticate token' });
    req.userId = decoded.id;
    next();
  });
};

// CLASSIFY route (Hugging Face)
router.post('/classify', authenticate, async (req, res) => {
  const { skills, careerGoal } = req.body;

  if (!Array.isArray(skills) || skills.length === 0 || !careerGoal || typeof careerGoal !== 'string') {
    return res.status(400).json({ error: 'Invalid input: skills array and careerGoal string are required' });
  }

  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/facebook/bart-large-mnli',
      {
        inputs: careerGoal,
        parameters: { candidate_labels: skills },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { labels, scores } = response.data;
    const skillGaps = labels.filter((_, i) => scores[i] < 0.5);

    res.json({ skillGaps, labels, scores });
  } catch (error) {
    console.error('Classification error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed classification' });
  }
});

// SUGGEST route (Cohere Chat API)
router.post('/suggest', authenticate, async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt string is required' });
  }

  try {
    const response = await axios.post(
      'https://api.cohere.ai/v1/chat',
      {
        model: 'command-r-plus', // working chat-compatible model
        message: prompt,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
          'Content-Type': 'application/json',
          'Cohere-Version': '2022-12-06',
        },
      }
    );

    const suggestion = response.data.text || 'No suggestion generated.';
    res.json({ suggestion: suggestion.trim() });
  } catch (error) {
    console.error('Cohere Chat API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate suggestion' });
  }
});

module.exports = router;
