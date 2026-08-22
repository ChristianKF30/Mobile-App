try {
    require('dotenv').config();
} catch (err) {
    // I produksjon på Render håndteres miljøvariabler direkte av systemet
}
const express = require('express');
const cors = require('cors');
const path = require('path');
const { pool, initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve the frontend (index.html) from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// --- HELPER: Fetch movie/series details (title & rating) from OMDB ---
async function getImdbDetails(imdbUrl) {
    const match = imdbUrl.match(/tt\d+/);
    if (!match) return null;
    const imdbId = match[0];

    const rawKey = process.env.OMDB_API_KEY;
    if (!rawKey) throw new Error('OMDB_API_KEY mangler i .env / Render environment.');
    const cleanKey = rawKey.trim().replace(/^\[|\]$/g, '').replace(/^['"]|['"]$/g, '');

    const res = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${cleanKey}`);
    if (!res.ok) {
        throw new Error(`OMDB returnerte HTTP status ${res.status} (${res.statusText})`);
    }
    const data = await res.json();
    if (data.Response === 'True') {
        return {
            title: data.Title,
            rating: (data.imdbRating && data.imdbRating !== 'N/A') ? data.imdbRating : null,
            year: data.Year || null
        };
    }
    return null;
}

// --- API ROUTES ---

// 1. Status check
app.get('/api/status', (req, res) => {
    res.json({ message: 'Server is up and running smoothly!' });
});

// 2. Get all notes
app.get('/api/notes', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM notes ORDER BY created_at DESC');
        res.json({ notes: result.rows });
    } catch (err) {
        console.error('DB feil (GET notes):', err.message);
        res.status(500).json({ error: 'Kunne ikke hente kommentarer.' });
    }
});

// 3. Add a note
app.post('/api/notes', async (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({ error: 'Tittel og innhold må fylles ut.' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO notes (title, content) VALUES ($1, $2) RETURNING *',
            [title, content]
        );
        res.json({ message: 'Kommentar lagret!', note: result.rows[0] });
    } catch (err) {
        console.error('DB feil (POST notes):', err.message);
        res.status(500).json({ error: 'Kunne ikke lagre kommentar.' });
    }
});

// 4. Delete a note
app.delete('/api/notes/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        await pool.query('DELETE FROM notes WHERE id = $1', [id]);
        res.json({ message: 'Kommentar slettet.' });
    } catch (err) {
        console.error('DB feil (DELETE notes):', err.message);
        res.status(500).json({ error: 'Kunne ikke slette kommentar.' });
    }
});

// 5. Get all wishes
app.get('/api/wishes', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM wishes ORDER BY created_at DESC');
        res.json({ wishes: result.rows });
    } catch (err) {
        console.error('DB feil (GET wishes):', err.message);
        res.status(500).json({ error: 'Kunne ikke hente ønskeliste.' });
    }
});

// 6. Add a wish (fetches title & rating from OMDB using the URL)
app.post('/api/wishes', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'IMDb URL må fylles ut.' });
    }
    try {
        const details = await getImdbDetails(url);
        if (!details || !details.title) {
            return res.status(400).json({ error: 'Kunne ikke hente film/serie fra IMDb. Sjekk at lenken er gyldig.' });
        }
        const result = await pool.query(
            'INSERT INTO wishes (title, imdb_url, rating) VALUES ($1, $2, $3) RETURNING *',
            [details.title, url, details.rating]
        );
        res.json({ message: 'Lagt til i ønskeliste!', wish: result.rows[0] });
    } catch (err) {
        console.error('OMDB/DB feil (POST wishes):', err.message);
        res.status(500).json({ error: 'Serverfeil ved henting av IMDb-detaljer.' });
    }
});

// 7. Delete a wish
app.delete('/api/wishes/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        await pool.query('DELETE FROM wishes WHERE id = $1', [id]);
        res.json({ message: 'Ønske slettet.' });
    } catch (err) {
        console.error('DB feil (DELETE wishes):', err.message);
        res.status(500).json({ error: 'Kunne ikke slette ønske.' });
    }
});

// Diagnostic: show first 40 chars of DATABASE_URL (safe - no password visible if short)
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error('FEIL: DATABASE_URL er ikke satt i miljøvariablene!');
    process.exit(1);
} else {
    console.log('DATABASE_URL lest som:', dbUrl.substring(0, 40) + '...');
}

// Start the server (init DB tables first)
initDb()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`App is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Kunne ikke koble til databasen:', err.message);
        console.error('Sjekk at DATABASE_URL er satt i .env-filen din.');
        process.exit(1);
    });
