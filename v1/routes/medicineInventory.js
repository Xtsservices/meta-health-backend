const express = require("express");
const router = express.Router();
// const verifyRoles = require("../middleware/verifyRoles");
const roles = require("../utils/roles");
const verifyAccess = require("../middleware/verifyAccess");
const verifyHospital = require("../middleware/verfiyHospital");

const {
  getMedicineInventory,
  postMedicineInventory,
  changeIsActiveStatus
} = require("../controllers/medicineInventory");

router
  .route("/:hospitalID/getMedicineInventory")
  .get(verifyAccess, verifyHospital, getMedicineInventory);
//change status for med
router.route("/changeisActive/:rowid").get(verifyAccess, changeIsActiveStatus);

router
  .route("/:hospitalID/postMedicineInventory")
  .post(verifyAccess, verifyHospital, postMedicineInventory);

module.exports = router;
