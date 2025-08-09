const express = require("express");
const router = express.Router();
const { getVersion, getApiVersion } = require("../controllers/version");
const verifyRoles = require("../middleware/verifyRoles");
const roles = require("../utils/roles");
const verifyAccess = require("../middleware/verifyAccess");
const verifyHospital = require("../middleware/verfiyHospital");
const { apiVersion } = require("../utils/versions");

router.route("/").get(getVersion);

router.route("/api").get(getApiVersion);

module.exports = router;
