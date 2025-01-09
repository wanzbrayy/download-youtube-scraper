const express = require('express');
const bodyParser = require('body-parser');
const ytdl = require('ytdl-core');
const youtubeSearch = require('youtube-search-scraper');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(bodyParser.json());

// Route untuk menyajikan file index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Fetch YouTube video
app.post('/fetch-youtube', async (req, res) => {
    const { url } = req.body;

    if (!ytdl.validateURL(url)) {
        const searchResults = await youtubeSearch.search(url);
        if (searchResults && searchResults.length > 0) {
            return res.json({ success: true, searchResults });
        }
        return res.json({ success: false, message: 'Invalid YouTube URL or keyword.' });
    }

    try {
        const videoInfo = await ytdl.getInfo(url);
        const formats = videoInfo.formats
            .filter(f => f.container === 'mp4' && f.hasVideo && f.hasAudio)
            .map(f => ({
                qualityLabel: f.qualityLabel || 'Unknown Quality',
                container: f.container,
                url: f.url,
            }));

        const defaultFormat = formats[0];
        res.json({ success: true, defaultFormat, formats });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'Error fetching YouTube video.' });
    }
});

// Fetch Instagram video
app.post('/fetch-instagram', async (req, res) => {
    const { url } = req.body;

    try {
        const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const match = response.data.match(/"video_url":"(.*?)"/);
        if (match && match[1]) {
            const videoUrl = match[1].replace(/\\u0026/g, '&');
            return res.json({ success: true, url: videoUrl });
        }
        res.json({ success: false, message: 'Invalid Instagram URL.' });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'Error fetching Instagram post.' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

