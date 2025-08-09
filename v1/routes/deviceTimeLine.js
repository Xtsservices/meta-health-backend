const express = require("express");
const router = express.Router();
const verifyAccess = require("../middleware/verifyAccess");
const verfiyHospital = require("../middleware/verfiyHospital");
const {
  addDeviceToPatient,
  removeDeviceFromPatient
} = require("../controllers/deviceTimeLine");

router
  .route("/hospital/:hospitalID")
  .post(verifyAccess, verfiyHospital, addDeviceToPatient)
  .patch(verifyAccess, verfiyHospital, removeDeviceFromPatient);

module.exports = router;
