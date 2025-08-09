const express = require("express");
const router = express.Router();
const verifyAccess = require("../middleware/verifyAccess");
const verfiyHospital = require("../middleware/verfiyHospital");
const {
  addDoctor,
  fetchAllDoctor,
  removeDoctorbyId,
  removeAllDoctor,
  TransferPatientDoctorbyId,
  TransferAllPatientDoctor,
  getAllNurses,
  DoctorAppointmentSchedule,
  getDoctorAppointmentsdata
} = require("../controllers/doctor");

router
  .route("/:hospitalID")
  .post(verifyAccess, verfiyHospital, addDoctor)
  .get(verifyAccess, verfiyHospital, fetchAllDoctor);

router
  .route("/:hospitalID/:timelineID/all")
  .get(verifyAccess, verfiyHospital, fetchAllDoctor)
  .delete(verifyAccess, verfiyHospital, removeAllDoctor);

router
  .route("/:hospitalID/:timelineID/:doctorId")
  .delete(verifyAccess, verfiyHospital, removeDoctorbyId);

router
  .route("/:hospitalID/:timelineID/transfer")
  .post(verifyAccess, verfiyHospital, TransferPatientDoctorbyId);

router
  .route("/:hospitalID/transfer/all")
  .post(verifyAccess, verfiyHospital, TransferAllPatientDoctor);

router
  .route("/:hospitalID/getAllNurse")
  .get(verifyAccess, verfiyHospital, getAllNurses);

router
  .route("/:hospitalID/doctorAppointmentSchedule")
  .post(verifyAccess, verfiyHospital, DoctorAppointmentSchedule);

router
  .route("/:hospitalID/:doctorID/getDoctorAppointmentsdata")
  .get(verifyAccess, verfiyHospital, getDoctorAppointmentsdata);

module.exports = router;
