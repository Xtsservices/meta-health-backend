const express = require("express");
const router = express.Router();
const verifyRoles = require("../middleware/verifyRoles");
const verifyAccess = require("../middleware/verifyAccess");
const roles = require("../utils/roles");
const verifyHospital = require("../middleware/verfiyHospital");
const {
  addPrescription,
  getAllPrecription
} = require("../controllers/prescription");

router
  .route("/:hospitalID/:timelineID/:patientID")
  .get(verifyAccess, verifyHospital, getAllPrecription);

// ====pending==
// Cannot add or update a child row: a foreign key constraint fails (`hospital`.`prescriptions`, CONSTRAINT `prescriptions_ibfk_2` FOREIGN KEY (`timeLineID`) REFERENCES `patientTimeLine` (`id`))
router.route("/:hospitalID").post(verifyAccess, addPrescription);

module.exports = router;
