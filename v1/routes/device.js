const express = require("express");
const router = express.Router();
const {
  addDevice,
  getAllDevices,
  getDevice,
  getAllHospitalDevices,
  addEmptyDevice
} = require("../controllers/device");
const verifyRoles = require("../middleware/verifyRoles");
const roles = require("../utils/roles");
const verifyAccess = require("../middleware/verifyAccess");
const verifyHospital = require("../middleware/verfiyHospital");

router.route("/").post(verifyAccess, addEmptyDevice);

router
  .route("/:hubID")
  .get(verifyAccess, getAllDevices)
  .post(verifyAccess, addDevice);

router.route("/:hubID/:id").get(verifyAccess, getDevice);

router
  .route("/hospital/:hospitalID/all")
  .get(verifyAccess, getAllHospitalDevices);

router
  .route("/sAdmin/hospital/:hospitalID")
  .get(verifyAccess, verifyRoles(roles.sAdmin), getAllHospitalDevices);

module.exports = router;
