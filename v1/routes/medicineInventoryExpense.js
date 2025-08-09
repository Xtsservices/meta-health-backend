const express = require("express");
const router = express.Router();
const verifyAccess = require("../middleware/verifyAccess");

const {
  AddInventoryExpense,
  getInventoryExpenseData,
  ReorderOrReplaceMedicine
} = require("../controllers/medicineInventoryExpense");

router
  .route("/:hospitalID/AddInventoryExpense")
  .post(verifyAccess, AddInventoryExpense);

router
  .route("/:hospitalID/ReorderOrReplaceMedicine")
  .post(verifyAccess, ReorderOrReplaceMedicine);

router
  .route("/:hospitalID/getInventoryExpenseData")
  .get(verifyAccess, getInventoryExpenseData);

module.exports = router;
