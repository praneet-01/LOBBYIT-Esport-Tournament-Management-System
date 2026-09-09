const express = require('express');
const router = express.Router();
const { getGames, getGameBySlug } = require('../controllers/gameController');

router.get('/', getGames);
router.get('/:slug', getGameBySlug);

module.exports = router;
