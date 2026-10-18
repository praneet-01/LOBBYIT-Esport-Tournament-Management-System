const express = require("express");
const router = express.Router();
const { chat } = require("../controllers/assistantController");

router.post("/", chat);

module.exports = router;
