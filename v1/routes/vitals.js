const express = require("express");
const router = express.Router();
const verifyRoles = require("../middleware/verifyRoles");
const verifyAccess = require("../middleware/verifyAccess");
const roles = require("../utils/roles");
const verifyHospital = require("../middleware/verfiyHospital");
const {
  addVitals,
  getAllVitals,
  getVitalFunctions,
  getSingleVital,
  getLatestVitals,
  getallvitalsbypatientid,
  getHomecarePatientVitalFunctions,
  getHomeCarePatient,
  getSingleVitalHospital,
} = require("../controllers/vitals");



router
.route("/getHomecarePatientVitalFunctions/:patientID")
.get(getHomecarePatientVitalFunctions);

//get all vitals based on patientId and date range
router
  .route("/getallvitalsbypatientid/:patientID")
  .get(verifyAccess, getallvitalsbypatientid);

router
  .route("/:hospitalID/:patientID")
  .post(verifyAccess, verifyHospital, addVitals)
  .get(verifyAccess, getAllVitals);

router
  .route("/:hospitalID/functions/:patientID")
  .get(verifyAccess, getVitalFunctions);

router
  .route("/getHomeCarePatient/:patientID/single")
  .get(verifyAccess, getHomeCarePatient);

router
  .route("/:hospitalID/:patientID/singleVital")
  .get(verifyAccess, getSingleVitalHospital);

router
  .route("/:hospitalID/:patientID/single")
  .get(verifyAccess, getSingleVital);

router
  .route("/:hospitalID/:patientID/latest")
  .get(verifyAccess, getLatestVitals);



module.exports = router;
