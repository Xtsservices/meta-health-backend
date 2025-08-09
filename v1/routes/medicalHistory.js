const express = require("express");
const router = express.Router();
const {
  addMedicalHistory,
  getMedicalHistoryByPatientID,
  getMedicalHistoryByID,
  editMedicalHistoryByID
} = require("../controllers/medicalHistory");
const verifyRoles = require("../middleware/verifyRoles");
const roles = require("../utils/roles");
const verifyAccess = require("../middleware/verifyAccess");
const verifyHospital = require("../middleware/verfiyHospital");

router
  .route("/:hospitalID/:id")
  .get(verifyAccess, verifyHospital, getMedicalHistoryByID);

router
  .route("/:hospitalID/patient/:patientID")
  .post(verifyAccess, verifyHospital, addMedicalHistory)
  .get(verifyAccess, getMedicalHistoryByPatientID);

router
  .route("/:hospitalID/patient/:patientID/:id")
  .patch(verifyAccess, verifyHospital, editMedicalHistoryByID);

module.exports = router;
