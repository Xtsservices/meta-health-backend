const express = require("express");
const router = express.Router();
const verifyAccess = require("../middleware/verifyAccess");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const {
  addPatientWithOrder,
  addWalkinPatients
} = require("../controllers/medicineInventoryPatients");

router
  .route("/:hospitalID/addPatientWithOrder")
  .post(verifyAccess, upload.array("files"), addPatientWithOrder);

router
  .route("/:hospitalID/tests/walkinPatients/:department")
  .post(verifyAccess, upload.array("files"), addWalkinPatients);

module.exports = router;
