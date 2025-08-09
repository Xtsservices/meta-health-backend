const express = require("express");
const router = express.Router();
const verifyRoles = require("../middleware/verifyRoles");
const verifyAccess = require("../middleware/verifyAccess");
const roles = require("../utils/roles");
const verifyHospital = require("../middleware/verfiyHospital");
const {
  addnewAdmintask,
  getadminalltasks,
  editAdmintask,
  deleteAdmintask
} = require("../controllers/adminTasksControllers");

router.route(`/addnewAdmintask`).post(verifyAccess, addnewAdmintask);

router.route(`/getadminalltasks`).get(verifyAccess, getadminalltasks);

router.route(`/editAdmintask/:taskId`).post(verifyAccess, editAdmintask);

router.route(`/deleteAdmintask/:taskId`).post(verifyAccess, deleteAdmintask);

module.exports = router;
