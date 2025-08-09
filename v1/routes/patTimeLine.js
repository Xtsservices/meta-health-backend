const express = require("express");
const router = express.Router();
const verifyRoles = require("../middleware/verifyRoles");
const verifyAccess = require("../middleware/verifyAccess");
const roles = require("../utils/roles");
const verifyHospital = require("../middleware/verfiyHospital");
const {
  getLatestTimeLineByPatientID,
  getAllTimeLineOfPatient,
  getAllTimeLines,
  getLatestTimeLineByPatienTimelinetID
} = require("../controllers/patTimeLine");

router.route("/:patientID").get(verifyAccess, getLatestTimeLineByPatientID);
router
  .route("/:hospitalID/:id")
  .get(verifyAccess, getLatestTimeLineByPatienTimelinetID);

router
  .route("/hospital/:hospitalID/patient/:patientID")
  .get(verifyAccess, getAllTimeLineOfPatient);

router
  .route("/hospital/:hospitalID/alltimeline/:patientID")
  .get(verifyAccess, verifyHospital, getAllTimeLines);

module.exports = router;
