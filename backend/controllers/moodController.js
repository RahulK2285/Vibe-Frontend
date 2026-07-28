const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

exports.handleMoodSearch = async (req, res) => {
    const { mood } = req.body;

    try {
        // 1. Get Song suggestions from Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Give me a list of 5 popular songs for a ${mood} vibe. Return only the song names and artists as a comma-separated list. No numbering or extra text.`;
        
        const result = await model.generateContent(prompt);
        const songSuggestions = result.response.text().split(',');

        // 2. Fetch YouTube details for the top suggestion
        const youtubeRes = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
            params: {
                part: 'snippet',
                q: songSuggestions[0], // Search for the first suggested song
                maxResults: 1,
                type: 'video',
                key: process.env.YOUTUBE_API_KEY
            }
        });

        const song = youtubeRes.data.items[0];
        
        if (!song) return res.status(404).json({ error: "No songs found" });

        res.json({
            videoId: song.id.videoId,
            title: song.snippet.title,
            thumbnail: song.snippet.thumbnails.high.url
        });

    } catch (error) {
        console.error("Mood Search Error:", error);
        res.status(500).json({ error: "AI Vibe search failed" });
    }
};