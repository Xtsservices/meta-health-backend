const express = require("express");
const router = express.Router();
const verifyRoles = require("../middleware/verifyRoles");
const verifyAccess = require("../middleware/verifyAccess");
const roles = require("../utils/roles");
const {
  addPurchase,
  updatePurchase,
  deletePurchase,
  getAllPurchases,
  getPurchaseByID
} = require("../controllers/purchase");

router
  .route("/:id")
  .get(verifyAccess, verifyRoles(roles.sAdmin), getPurchaseByID)
  .patch(verifyAccess, verifyRoles(roles.sAdmin), updatePurchase)
  .delete(verifyAccess, verifyRoles(roles.sAdmin), deletePurchase);

router
  .route("/hospital/:hospitalID")
  .post(verifyAccess, verifyRoles(roles.sAdmin), addPurchase)
  .get(verifyAccess, verifyRoles(roles.sAdmin), getAllPurchases);

module.exports = router;
