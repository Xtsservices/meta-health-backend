const express = require("express");
const router = express.Router();
const verifyRoles = require("../middleware/verifyRoles");
const verifyAccess = require("../middleware/verifyAccess");
const roles = require("../utils/roles");
const verifyHospital = require("../middleware/verfiyHospital");
const {
  insertSymptomsList,
  getAllSymptoms,
  getSymptomFromID,
  deleteSymptomFromID
} = require("../controllers/symptoms");

router.route("/").post(verifyAccess, insertSymptomsList);

router.route("/:patientID").get(verifyAccess, getAllSymptoms);

router
  .route("/:timeLineID/:symptomID")
  .get(verifyAccess, getSymptomFromID)
  .delete(verifyAccess, deleteSymptomFromID);

module.exports = router;
