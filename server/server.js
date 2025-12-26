require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const nodemailer = require('nodemailer');



const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Health Check ---
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Iniciar Cron JObs
    try {
        const { startCronJobs } = require('./cronJobs');
        startCronJobs();
    } catch (e) {
        console.error("Erro ao iniciar Cron Jobs:", e);
    }
});
