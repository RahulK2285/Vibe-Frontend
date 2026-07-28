const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/search', async (req, res) => {
    try {
        const { q: query } = req.query;
        if (!query) return res.json([]);

        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: query,
                maxResults: 6, // ✅ Fixed: Strictly top 10 results
                type: 'video',
                key: process.env.YOUTUBE_API_KEY
            }
        });

        const songs = response.data.items.map(item => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.default.url
        }));

        res.json(songs);
    } catch (err) {
        console.error("YouTube API Error:", err.message);
        res.status(500).json({ error: "Failed to fetch songs" });
    }
});

module.exports = router;