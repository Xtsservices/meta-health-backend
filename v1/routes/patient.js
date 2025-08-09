const express = require("express");
const router = express.Router();
const {
  addPatient,
  getAllPatientsByTypeForReception,
  getAllPatientsByType,
  getRecentPatientsByType,
  getPatientCountByType,
  getTotalPatientCount,
  getPatientCountByMonthYear,
  isViewedPatient,
  dischargePatient,
  getPatientByID,
  getYearCount,
  getOtYearCount,
  getPatientVisitByDepartment,
  getPhotoImageURL,
  updatePatientByID,
  patientRevisit,
  checkDevicePresent,
  getSummary,
  getPercentageUseOfDevices,
  getPercentageUsageOfHubs,
  getCalendarCard,
  getAllPatientsByTypeWithFilter,
  transferPatient,
  doctorSummary,
  getPatientCountOnFilter,
  getPatientVisitCountByMonthYear,
  getPatientVisitByDepartmentWithFilter,
  createFollowUp,
  checkIfpatientExists,
  getpatientsForTriage,
  getPatientByIDForTriage,
  getCountOfPatientsByZone,
  getOpdPreviousPatientsList,
  getAllPatientCountByHospital,
  getNurseRecentPatients,
  getNurseOpdPreviousPatientsList,
  getNurseIpdPatientsByType
} = require("../controllers/patient");
const verifyRoles = require("../middleware/verifyRoles");
const verifyAccess = require("../middleware/verifyAccess");
const roles = require("../utils/roles");
const verifyHospital = require("../middleware/verfiyHospital");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router
  .route("/:hospitalID/patients/recent/:ptype")
  .get(verifyAccess, verifyHospital, getRecentPatientsByType);

router
  .route("/:hospitalID/patients/opdprevious/:ptype")
  .get(verifyAccess, verifyHospital, getOpdPreviousPatientsList);

router
  .route("/:hospitalID/patients")
  .post(
    verifyAccess,
    verifyHospital,
    verifyRoles(roles.doctor, roles.nurse, roles.staff, roles.reception),
    upload.single("photo"),
    addPatient
  );

router
  .route("/:hospitalID/patients/:id/transfer")
  .patch(verifyAccess, transferPatient);

router
  .route("/:hospitalID/patients/isviewchange/:id")
  .get(verifyAccess, verifyHospital, isViewedPatient);

router
  .route("/:hospitalID/patients/discharge/:id")
  .post(verifyAccess, verifyHospital, dischargePatient);

router
  .route("/:hospitalID/patients/revisit/:id")
  .post(verifyAccess, verifyHospital, patientRevisit);

router
  .route("/:hospitalID/patients/checkRecord/:pID")
  .get(verifyAccess, verifyHospital, checkIfpatientExists);

router
  .route("/:hospitalID/patients/summary")
  .get(verifyAccess, verifyHospital, verifyRoles(roles.admin), getSummary);

router
  .route("/:hospitalID/patients/doctorSummary")
  .get(verifyAccess, verifyHospital, verifyRoles(roles.admin), doctorSummary);

router
  .route("/:hospitalID/patients/calendarCards")
  .get(verifyAccess, verifyHospital, getCalendarCard);

router
  .route("/:hospitalID/patients/devicePercentage")
  .get(
    verifyAccess,
    verifyHospital,
    verifyRoles(roles.admin),
    getPercentageUseOfDevices
  );

router
  .route("/:hospitalID/patients/hubPercentage")
  .get(
    verifyAccess,
    verifyHospital,
    verifyRoles(roles.admin),
    getPercentageUsageOfHubs
  );

// ===============getting all patients=====forall=============
router
  .route("/:hospitalID/patients/:ptype")
  .get(verifyAccess, verifyHospital, getAllPatientsByType);

// ===============getting all patients for reception==================
router
  .route("/:hospitalID/receptionpatients/:ptype")
  .get(verifyAccess, verifyHospital, getAllPatientsByTypeForReception);

router
  .route("/:hospitalID/patients/triage/:ptype")
  .get(verifyAccess, verifyHospital, getpatientsForTriage);

router
  .route("/:hospitalID/patients/filter/:ptype")
  .get(verifyAccess, verifyHospital, getAllPatientsByTypeWithFilter);

router
  .route("/:hospitalID/patients/single/:id")
  .get(verifyAccess,  getPatientByID)
  .patch(
    verifyAccess,
    verifyHospital,
    upload.single("photo"),
    updatePatientByID
  );

  router
  .route("/patients/customerCare/:id")
  .get(verifyAccess,  getPatientByID);

router
  .route("/:hospitalID/patients/single/triage/:id")
  .get(verifyAccess, verifyHospital, getPatientByIDForTriage)
  .patch(
    verifyAccess,
    verifyHospital,
    upload.single("photo"),
    updatePatientByID
  );

router
  .route("/:hospitalID/patients/deviceCheck/:id")
  .get(verifyAccess, verifyHospital, checkDevicePresent);

router
  .route("/:hospitalID/patients/photo/:photo")
  .get(verifyAccess, verifyHospital, getPhotoImageURL);

router
  .route("/:hospitalID/patients/count/all")
  .get(verifyAccess, verifyHospital, getTotalPatientCount);

router
  .route("/:hospitalID/patients/count/zone/:selectedZoneDataFilter")
  .get(verifyAccess, verifyHospital, getCountOfPatientsByZone);

router
  .route("/:hospitalID/patients/count/departments")
  .get(verifyAccess, verifyHospital, getPatientVisitByDepartment);

router
  .route("/:hospitalID/patients/count/departments/filter")
  .get(verifyAccess, verifyHospital, getPatientVisitByDepartmentWithFilter);

router
  .route("/:hospitalID/patients/count/:ptype")
  .get(verifyAccess, verifyHospital, getPatientCountByType);

router
  .route("/:hospitalID/patients/count/ipdfullYearFilter/:ptype")
  .get(verifyAccess, verifyHospital, getYearCount);

router
  .route(
    "/:hospitalID/patients/count/fullYear/:patientType/:selectedYear/:ptype"
  )
  .get(verifyAccess, verifyHospital, getOtYearCount);

router
  .route("/:hospitalID/patients/count/fullYearFilter/all")
  .get(verifyAccess, verifyHospital, getAllPatientCountByHospital);

router
  .route("/:hospitalID/patients/count/fullYearFilter/:ptype")
  .get(verifyAccess, verifyHospital, getPatientCountOnFilter);

router
  .route("/:hospitalID/patients/count/visit/:year/:month")
  .get(verifyAccess, verifyHospital, getPatientCountByMonthYear);

router
  .route("/:hospitalID/patients/count/visit/combined") /////////Provide ptype in query////////////////////////
  .get(verifyAccess, verifyHospital, getPatientVisitCountByMonthYear);

router
  .route("/:hospitalID/patients/followup/:timelineID")
  .post(verifyAccess, verifyHospital, createFollowUp);

//get latest patients data  for nurse
router
  .route("/:hospitalID/patients/nurseRecent/:ptype")
  .get(verifyAccess, verifyHospital, getNurseRecentPatients);

//get previous patients data  for nurse
router
  .route("/:hospitalID/patients/nurseopdprevious/:ptype")
  .get(verifyAccess, verifyHospital, getNurseOpdPreviousPatientsList);
//get previous patients data  for nurse  ipd
router
  .route("/:hospitalID/nurseIpdpatients/:ptype")
  .get(verifyAccess, verifyHospital, getNurseIpdPatientsByType);

module.exports = router;
