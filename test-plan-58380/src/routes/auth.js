const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  // Login logic
  res.json({ token: 'fake-jwt-token' });
});

module.exports = router;
