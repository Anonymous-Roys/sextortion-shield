// middleware.js
const apiKey = process.env.API_KEY; // Ensure to set this environment variable

const verifyApiKey = (req, res, next) => {
    const userApiKey = req.headers['x-api-key'];

    if (userApiKey && userApiKey === apiKey) {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden - Invalid API Key' });
    }
};

module.exports = verifyApiKey;

