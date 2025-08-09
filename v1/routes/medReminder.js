const express = require("express");
const router = express.Router();
const verifyRoles = require("../middleware/verifyRoles");
const roles = require("../utils/roles");
const verifyAccess = require("../middleware/verifyAccess");
const verifyHospital = require("../middleware/verfiyHospital");
const {
  getReminderById,
  updateReminder
} = require("../controllers/medReminder");

router
  .route("/:id")
  .get(verifyAccess, getReminderById)
  .patch(verifyAccess, updateReminder);

module.exports = router;
