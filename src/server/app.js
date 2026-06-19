const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const typingRoutes = require('./routes/typingRoutes');

function createApp() {
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: false
  }));
  app.use(cors());
  app.use(express.json({ limit: '64kb' }));
  app.use(morgan('dev'));

  app.use('/api', typingRoutes);
  app.use(express.static(path.join(__dirname, '../../public')));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
  });

  return app;
}

module.exports = { createApp };
