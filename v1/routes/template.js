const express = require("express");
const router = express.Router();
const verifyHospital = require("../middleware/verfiyHospital");
const verifyAccess = require("../middleware/verifyAccess");
const roles = require("../utils/roles");
const verifyRoles = require("../middleware/verifyRoles");
const {
  addNewTemplate,
  getTemplates,
  deleteTemplate,
  getproxyimage
} = require("../controllers/template");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router
  .route("/:hospitalID/:userID")
  .post(
    verifyAccess,
    verifyRoles(roles.admin),
    verifyHospital,
    upload.single("file"),
    addNewTemplate
  )
  .get(verifyAccess, getTemplates);
router
  .route("/:tableid/:hospitalID/:userID")
  .delete(
    verifyAccess,
    verifyRoles(roles.admin),
    verifyHospital,
    deleteTemplate
  );
router.route("/proxyimage").get(getproxyimage);

module.exports = router;
