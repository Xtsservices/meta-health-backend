const express = require("express");
const router = express.Router();
const {
  addHub,
  getAllHubs,
  getHub,
  removeHubFromHospital
} = require("../controllers/hub");
const verifyRoles = require("../middleware/verifyRoles");
const roles = require("../utils/roles");
const verifyAccess = require("../middleware/verifyAccess");
const verifyHospital = require("../middleware/verfiyHospital");

router
  .route("/:hospitalID")
  .get(verifyAccess, verifyHospital, getAllHubs)
  .post(verifyAccess, verifyHospital, addHub);

router
  .route("/sAdmin/:hospitalID")
  .get(verifyAccess, verifyRoles(roles.sAdmin), getAllHubs);

router.route("/:hospitalID/:id").get(verifyAccess, verifyHospital, getHub);

router
  .route("/remove/:id")
  .patch(verifyAccess, verifyRoles(roles.sAdmin), removeHubFromHospital);

module.exports = router;
