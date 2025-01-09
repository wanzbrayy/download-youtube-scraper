const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const ytdl = require('ytdl-core');
const { youtubeSearch } = require('youtube-search-scraper');
const path = require('path');

const app = express();
const PORT = 8080;

// Middleware untuk meng-handle JSON request
app.use(bodyParser.json());

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint untuk fetch video YouTube
app.post('/fetch-youtube', async (req, res) => {
    const { url } = req.body;

    try {
        let videoInfo;

        // Cek apakah URL valid untuk YouTube
        if (ytdl.validateURL(url)) {
            videoInfo = await ytdl.getInfo(url);
        } else {
            const searchResults = await youtubeSearch(url);
            if (searchResults.length > 0) {
                videoInfo = await ytdl.getInfo(searchResults[0].url);
            } else {
                return res.status(400).json({ success: false, message: 'No YouTube videos found for the given keyword.' });
            }
        }

        const formats = videoInfo.formats
            .filter(format => format.hasVideo && format.hasAudio)
            .map(format => ({
                url: format.url,
                qualityLabel: format.qualityLabel || 'Unknown Quality',
            }));

        res.json({
            success: true,
            defaultFormat: formats[0], // Default to the first format
            formats, // List of all formats for resolution buttons
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch YouTube video.' });
    }
});

// Endpoint untuk fetch video Instagram
app.post('/fetch-instagram', async (req, res) => {
    const { url } = req.body;

    try {
        // Gunakan API InstaDownloader untuk mengambil URL video Instagram
        const apiUrl = `https://www.instagram.com/api/v1/media/item/?url=${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl);

        if (response.data && response.data.media && response.data.media.video_url) {
            const videoUrl = response.data.media.video_url;
            res.json({ success: true, url: videoUrl });
        } else {
            res.status(400).json({ success: false, message: 'Invalid Instagram URL or unable to fetch video.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch Instagram video.' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
