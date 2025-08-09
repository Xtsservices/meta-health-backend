const express = require("express");
const router = express.Router();
const { getAllActiveFollowUp } = require("../controllers/followUp");
const verifyRoles = require("../middleware/verifyRoles");
const verifyAccess = require("../middleware/verifyAccess");
const roles = require("../utils/roles");
const verifyHospital = require("../middleware/verfiyHospital");
router
  .route("/:hospitalID/active")
  .get(
    verifyAccess,
    verifyHospital,
    verifyRoles(roles.doctor, roles.nurse, roles.staff),
    getAllActiveFollowUp
  );

module.exports = router;
