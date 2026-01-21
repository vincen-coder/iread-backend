const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const googleTTS = require('google-tts-api');

const app = express();
const PORT = process.env.PORT || 3000; // Render sets the port automatically


app.use(cors({
    origin: '*',           // Allow ANY website (Vercel, Mobile, Localhost)
    methods: ['GET', 'POST'], // Allow reading and writing
    allowedHeaders: ['Content-Type']
})); 
app.use(bodyParser.json({ limit: '10mb' })); 

// 2. THE ROUTE (The "Order Window")
app.post('/convert', async (req, res) => {
    const { text } = req.body;

    if (!text || text.length === 0) {
        return res.status(400).send('No text provided');
    }

    console.log(`Processing request: ${text.length} characters...`);

    try {
        // A. Ask Google for the audio URLs (Splits long text automatically)
        const audioUrls = googleTTS.getAllAudioUrls(text, {
            lang: 'en',
            slow: false,
            host: 'https://translate.google.com',
            splitPunct: ',.?!', // Pause at punctuation for natural flow
        });

        // B. Download all the audio pieces
        const audioBuffers = await Promise.all(
            audioUrls.map(async (item) => {
                const response = await fetch(item.url);
                const arrayBuffer = await response.arrayBuffer();
                return Buffer.from(arrayBuffer);
            })
        );

        // C. Stitch them into one big MP3 file
        const finalAudio = Buffer.concat(audioBuffers);

        // D. Send it back to the user
        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': finalAudio.length,
            'Content-Disposition': 'attachment; filename="study-audio.mp3"',
        });

        res.send(finalAudio);
        

    } catch (error) {
        console.error("Error generating audio:", error);
        res.status(500).send('Server failed to convert text.');
    }
});

// 3. START SERVER
app.listen(PORT, () => {
    console.log(`Kitchen is open! Server running on port ${PORT}`);
});