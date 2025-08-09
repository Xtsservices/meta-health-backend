const express = require("express");
const router = express.Router();
const {
  addWards,
  getWard,
  getAllWards,
  updateSingleWard,
  deleteSingleWard,
  getPatientCountForAllWards,
  patientDistribution,
  patientDistributionForStaffDashboard
} = require("../controllers/wards");
const verifyHospital = require("../middleware/verfiyHospital");
const verifyAccess = require("../middleware/verifyAccess");
const roles = require("../utils/roles");
const verifyRoles = require("../middleware/verifyRoles");

router
  .route("/:hospitalID")
  .post(verifyAccess, verifyRoles(roles.admin), verifyHospital, addWards)
  .get(
    verifyAccess,
    verifyRoles(roles.admin, roles.staff, roles.doctor, roles.nurse,roles.headNurse,roles.customerCare),
    getAllWards
  );
router
  .route("/:hospitalID/getSummary")
  .get(verifyAccess, verifyRoles(roles.admin), getPatientCountForAllWards);

router
  .route("/:hospitalID/getDistribution")
  .get(verifyAccess, verifyRoles(roles.admin), patientDistribution);

router
  .route("/:hospitalID/distributionForStaff/:selectedWardDataFilter")
  .get(
    verifyAccess,
    verifyRoles(roles.nurse, roles.doctor),
    patientDistributionForStaffDashboard
  );

router
  .route("/:hospitalID/:id")
  .get(verifyAccess, verifyRoles(roles.admin), verifyHospital, getWard)
  .patch(
    verifyAccess,
    verifyRoles(roles.admin),
    verifyHospital,
    updateSingleWard
  )
  .delete(
    verifyAccess,
    verifyRoles(roles.admin),
    verifyHospital,
    deleteSingleWard
  );

module.exports = router;
