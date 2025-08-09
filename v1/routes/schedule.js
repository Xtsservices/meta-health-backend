const express = require("express");
const router = express.Router();
const verifyAccess = require("../middleware/verifyAccess");
const verfiyHospital = require("../middleware/verfiyHospital");
const { viewSchedule, addSchedule } = require("../controllers/schedule");

router
  .route("/:hospitalID/:userId/viewSchedule")
  .get(verifyAccess, verfiyHospital, viewSchedule);

router
  .route("/:hospitalID/:userId/:patientTimeLineId/:patientID/addSchedule")
  .post(verifyAccess, verfiyHospital, addSchedule);

module.exports = router;
