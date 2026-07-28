const axios = require('axios');

exports.searchYouTube = async (query) => {
  const res = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
    params: {
      part: 'snippet',
      maxResults: 1,
      q: query,
      type: 'video',
      key: process.env.YOUTUBE_API_KEY
    }
  });
  const item = res.data.items[0];
  return item ? {
    videoId: item.id.videoId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails.high.url
  } : null;
};