const express = require("express");
const router = express.Router();
const verifyRoles = require("../middleware/verifyRoles");
const roles = require("../utils/roles");
const verifyAccess = require("../middleware/verifyAccess");
const verifyHospital = require("../middleware/verfiyHospital");
const {
  addMedicine,
  getMedicineFromID,
  testTimeStamp,
  getAllMedicines,
  getAllMedicinesFromStatus,
  getAllMedicineReminders,
  getMedicines,
  getAllMedicineRemindersFromDateTime,
  getMedicineNotifications,
  getAllPreviousmedlist,
  getChartReminders
} = require("../controllers/medicine");

// ====================error in query medStatus not found====================
router
  .route("/:timeLineID/status/:medStatus")
  .get(verifyAccess, getAllMedicinesFromStatus);
// ====================error in query medStatus not found====================

router
  .route("/:hospitalID/getMedicines")
  .get(verifyAccess, getMedicines)
  .post(verifyAccess, getMedicines);

router.route("/").post(verifyAccess, addMedicine);

router.route("/testTimeStamp").post(verifyAccess, testTimeStamp);

router.route("/:timeLineID").get(verifyAccess, getAllMedicines);

router.route("/:timeLineID/chart").get(verifyAccess, getChartReminders);

router.route("/:timeLineID/:id").get(verifyAccess, getMedicineFromID);

router
  .route("/:timeLineID/reminders/all")
  .get(verifyAccess, getAllMedicineReminders);

//get all previous medlist

router
  .route("/:timeLineID/previous/allmedlist")
  .get(verifyAccess, getAllPreviousmedlist);
// router.route('/:timeLineID/reminders/all/:dateTime')
//     .get(verifyAccess,getAllMedicineRemindersFromDateTime)

router
  .route("/:timeLineID/reminders/all/notifications")
  .get(verifyAccess, getMedicineNotifications);

module.exports = router;
