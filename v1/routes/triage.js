const express = require("express");
const {
  insertTriage,
  getTriageByTimelineID
} = require("../controllers/triage");
const verifyHospital = require("../middleware/verfiyHospital");
const verifyAccess = require("../middleware/verifyAccess");
const router = express.Router();

// Route to insert triage
router.post(
  "/:hospitalID/:patientID",
  verifyAccess,
  verifyHospital,
  insertTriage
);

// Route to get triage by timelineID
router.get(
  "/:hospitalID/:timelineID",
  verifyAccess,
  verifyHospital,
  getTriageByTimelineID
);

module.exports = router;
