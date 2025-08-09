const express = require("express");
const router = express.Router();
const verifyRoles = require("../middleware/verifyRoles");
const verifyAccess = require("../middleware/verifyAccess");
const roles = require("../utils/roles");
const verifyHospital = require("../middleware/verfiyHospital");

// Controller functions
const { addPocus, getPocus } = require("../controllers/pocus");

// Routes

router
  .route("/:hospitalID/:timeLineID")
  .post(verifyAccess, verifyHospital, addPocus)
  .get(verifyAccess, getPocus);

module.exports = router;
