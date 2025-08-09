const express = require("express");
const router = express.Router();
const {
  getAllHospitals,
  getHospital,
  addNewHospital,
  updateHospitalRecord,
  deleteHospital,
  createAdmin,
  getAdmins,
  getRecentHospitals,
  getAdminByID,
  updateAdmin,
  getCount
} = require("../controllers/hospital");
const verifyRoles = require("../middleware/verifyRoles");
const roles = require("../utils/roles");
const verifyAccess = require("../middleware/verifyAccess");
const verifyHospital = require("../middleware/verfiyHospital");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router
  .route("/")
  .get(verifyAccess, verifyRoles(roles.sAdmin), getAllHospitals)
  .post(verifyAccess, verifyRoles(roles.sAdmin), addNewHospital);

router
  .route("/recent")
  .get(verifyAccess, verifyRoles(roles.sAdmin), getRecentHospitals);

router.route("/count").get(verifyAccess, verifyRoles(roles.sAdmin), getCount);

router
  .route("/:hospitalID")
  .get(verifyAccess, verifyRoles(roles.sAdmin), getHospital)
  .patch(verifyAccess, verifyRoles(roles.sAdmin), updateHospitalRecord)
  .delete(verifyAccess, verifyRoles(roles.sAdmin), deleteHospital);

router
  .route("/:hospitalID/admin")
  .post(
    verifyAccess,
    verifyRoles(roles.sAdmin),
    upload.single("photo"),
    createAdmin
  )
  .get(verifyAccess, verifyRoles(roles.sAdmin), getAdmins);

router
  .route("/:hospitalID/admin/:adminID")
  .patch(
    verifyAccess,
    verifyRoles(roles.sAdmin),
    upload.single("photo"),
    updateAdmin
  )
  .get(verifyAccess, verifyRoles(roles.sAdmin), getAdminByID);

module.exports = router;
