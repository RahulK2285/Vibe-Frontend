const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

exports.searchMusic = async (req, res) => {
  const { q, ai } = req.query;

  try {
    let searchQuery = q;

    // 1. AI Mood Interpretation (Avoids keyword matching)
    if (ai === 'true') {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // We instruct Gemini to provide actual song titles for the vibe, NOT use the word itself
      const prompt = `User wants music for this mood: "${q}". 
      Suggest 5 specific, high-quality songs that fit this vibe. 
      Do NOT suggest songs that contain the word "${q}" in the title. 
      Return ONLY a semicolon-separated list of "Song Name - Artist". 
      No numbering, no extra text.`;
      
      const result = await model.generateContent(prompt);
      const textResponse = result.response.text().trim();
      
      // Get the first song from the AI's curated list to search on YouTube
      searchQuery = textResponse.includes(';') ? textResponse.split(';')[0] : textResponse;
    }

    // 2. YouTube Search (Strictly Top 5)
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: `${searchQuery} official music video`, 
        maxResults: 5, // Limit to top 5 results as requested
        type: 'video',
        videoCategoryId: '10', // Filters for Music category
        key: process.env.YOUTUBE_API_KEY,
      },
    });

    const songs = response.data.items.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high.url,
    }));

    res.json(songs);
  } catch (error) {
    console.error("Music Search Error:", error.message);
    res.status(500).json({ error: "Could not find songs for this vibe" });
  }
};