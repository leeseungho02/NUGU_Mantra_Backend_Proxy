const express = require('express');
const nugu = require('../nugu');
const router = express.Router();

router.post('/nugu/StartMeditationAction', nugu);
router.post('/nugu/StartWhitenoiseAction', nugu);
router.post('/nugu/StartSleepAction', nugu);

module.exports = router;