const express = require('express');
const crypto = require('crypto');

const router = express.Router();
const ALLOWED_ALGORITHMS = ['sha256', 'sha512', 'md5'];
router.post('/hash', (req, res) => {
  const { text, algorithm = 'sha256' } = req.body || {};

  if (typeof text !== 'string' || text.length === 0) {
    return res.status(400).json({ message: 'El campo "text" es requerido y debe ser una cadena.' });
  }

  if (!ALLOWED_ALGORITHMS.includes(algorithm.toLowerCase())) {
    return res.status(400).json({ message: `Algoritmo no permitido. Use uno de: ${ALLOWED_ALGORITHMS.join(', ')}` });
  }

  try {
    const hash = crypto.createHash(algorithm.toLowerCase()).update(text, 'utf8').digest('hex');
    return res.json({ hash });
  } catch (err) {
    console.error('Error generating hash:', err);
    return res.status(500).json({ message: 'Error al generar el hash', error: err.message });
  }
});

module.exports = router;
