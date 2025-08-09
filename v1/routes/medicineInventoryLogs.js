const express = require("express");
const router = express.Router();
const verifyAccess = require("../middleware/verifyAccess");

const {
  addInventoryLogs,
  getInventoryLogs,
  editMedicineInventoryData
} = require("../controllers/medicineInventoryLogs");

router
  .route("/:hospitalID/addInventoryLogs")
  .post(verifyAccess, addInventoryLogs);
//editMedicineInventoryData
router
  .route("/:hospitalID/editMedicineInventoryData/:rowId")
  .post(verifyAccess, editMedicineInventoryData);

router
  .route("/:hospitalID/getInventoryLogs")
  .get(verifyAccess, getInventoryLogs);

module.exports = router;
