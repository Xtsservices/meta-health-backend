const express = require("express");
const router = express.Router();
const { healthCheck } = require("../controllers/health");

router.route("/").get(healthCheck);

module.exports = router;
