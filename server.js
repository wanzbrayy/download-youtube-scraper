const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const ytdl = require('ytdl-core');
const { youtubeSearch } = require('youtube-search-scraper');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = 8080;

// Middleware
app.use(bodyParser.json());

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint untuk fetch video YouTube
app.post('/fetch-youtube', async (req, res) => {
    const { url } = req.body;

    try {
        let videoInfo;
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
            defaultFormat: formats[0],
            formats,
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
        // Validasi URL Instagram
        const validInstagramUrl = /https:\/\/www\.instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+/;
        if (!validInstagramUrl.test(url)) {
            return res.status(400).json({ success: false, message: 'Invalid Instagram URL.' });
        }

        // Ambil halaman Instagram
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        });

        // Parsing konten HTML
        const $ = cheerio.load(response.data);
        const videoUrl = $('meta[property="og:video"]').attr('content') || $('meta[name="twitter:player"]').attr('content');

        if (videoUrl) {
            res.json({ success: true, url: videoUrl });
        } else {
            res.status(400).json({ success: false, message: 'Video not found on Instagram.' });
        }
    } catch (error) {
        console.error('Error fetching Instagram video:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch Instagram video.' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
