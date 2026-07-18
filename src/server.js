const express = require('express');
require('dotenv').config();
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const widgetsRoutes = require('./routes/widgets.routes');
const configRoutes = require('./routes/config.routes');
const submissionsRoutes = require('./routes/submissions.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware: parse incoming JSON request bodies
app.use(express.json());
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
 
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
// Serve static files (embed script) from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Health check route (useful to verify the server is alive)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Mount auth routes under /auth
app.use('/auth', authRoutes);
app.use('/widgets', submissionsRoutes);
app.use('/widgets', configRoutes);
app.use('/widgets', widgetsRoutes);
app.use('/owners', widgetsRoutes);
// Basic 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;