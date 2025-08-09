const express = require("express");
const router = express.Router();
const {
  addDepartments,
  getDepartment,
  getAllDepartments,
  updateDepartment,
  deleteDepartment,
  getDepartmentByID
} = require("../controllers/department");
const verifyHospital = require("../middleware/verfiyHospital");
const verifyAccess = require("../middleware/verifyAccess");
const roles = require("../utils/roles");
const verifyRoles = require("../middleware/verifyRoles");

router.route("/singledpt/:id").get(verifyAccess, getDepartmentByID);

router
  .route("/:hospitalID")
  .post(verifyAccess, verifyRoles(roles.admin), verifyHospital, addDepartments)
  .get(
    verifyAccess,
    verifyRoles(roles.admin, roles.staff, roles.doctor, roles.nurse),
    verifyHospital,
    getAllDepartments
  );

router
  .route("/:hospitalID/:id")
  .get(verifyAccess, verifyRoles(roles.admin), verifyHospital, getDepartment)
  .patch(
    verifyAccess,
    verifyRoles(roles.admin),
    verifyHospital,
    updateDepartment
  )
  .delete(
    verifyAccess,
    verifyRoles(roles.admin),
    verifyHospital,
    deleteDepartment
  );

module.exports = router;
