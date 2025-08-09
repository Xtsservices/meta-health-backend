const express = require("express");
const router = express.Router();
const verifyAccess = require("../middleware/verifyAccess");

const {
  getAllManufacture
} = require("../controllers/medicineInventoryManufacture");

router
  .route("/:hospitalID/getAllManufacture")
  .get(verifyAccess, getAllManufacture);

module.exports = router;
