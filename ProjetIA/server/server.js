import cors from 'cors';
import express from 'express';
import multer from 'multer';
import OpenAI from "openai";
import { API_KEY } from './config.js';

const openai = new OpenAI({
    apiKey: API_KEY,
});

const app = express();
const port = 3001;

// Utiliser le middleware cors pour toutes les routes
app.use(cors({
    origin: 'http://localhost:4200',
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept',
}));

// Middleware pour parser les corps de requêtes JSON et urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer();

// Route de test
app.get('/test', (req, res) => {
    res.send('Server is running');
});

app.post('/chat', upload.none(), async (req, res) => {
    try {
        const prompt = req.body.prompt;
        console.log("PROMPT: ", prompt);
        
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              {
                "role": "user",
                "content": prompt
              }
            ],
            temperature: 1,
            max_tokens: 50,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });

        console.log("RESPONSE: ", response);

        res.json(response);
    } catch (error) {
        console.error("Error processing /chat request:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.post('/image', upload.none(), async (req, res) => {
    try {
        const prompt = req.body.prompt;
        console.log("IMAGE PROMPT: ", prompt);

        const response = await openai.images.generate({
            prompt: prompt,
            n: 1,
            size: "1024x1024"
        });

        res.json(response);
    } catch (error) {
        console.error("Error processing /image request:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});
