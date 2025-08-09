const express = require("express");
const router = express.Router();
const verifyRoles = require("../middleware/verifyRoles");
const verifyAccess = require("../middleware/verifyAccess");
const roles = require("../utils/roles");
const verifyHospital = require("../middleware/verfiyHospital");
const {
  getVitalAlerts,
  getHospitalAlerts,
  updateSeenStatus,
  getAlertCount,
  getIndividualAlerts,
  updateIndividualSeenAlerts,
  getAllVitalAlertsByhospitals,
  getIndividualPatientDetails,
  getccedashboardalertcount,
  getHospitalAlertsByTimeIntervals,
  getIndividualAlertsByTimeIntervals,
  getVitalAlertsByHour,
  getIndividualAlertsByDateHourly,

  getIndividualAlertsByYearAndMonth,

  getcceAlertsStatsHospital,
  getIndividualHomeCarePatientsVitails,

} = require("../controllers/alerts");

router.route("/hospital/:id").patch(verifyAccess, updateSeenStatus);


// get vital alerts stats counts for dashboard by customercare hospitals
router
  .route("/getcceAlertsStatsHospital/:year/:month")
  .get(verifyAccess, getcceAlertsStatsHospital);

// get vital alerts counts for dashboard by customercare hospitals
router
  .route("/getccedashboardalertcount")
  .get(verifyAccess, getccedashboardalertcount);
  
router
  .route(`/hospital/:hospitalID`)
  .get(verifyAccess, verifyHospital, getHospitalAlerts);

  
router
.route(`/individualAlerts`)
.get(verifyAccess, getIndividualAlerts);

router
.route(`/updateIndividualSeenAlerts/:id`)
.patch(verifyAccess, updateIndividualSeenAlerts);


router
.route(`/individualPatientDetails/:patientID`)
.get(verifyAccess, getIndividualPatientDetails);

router
  .route(`/hospital/:hospitalID/unseenCount`)
  .get(verifyAccess, verifyHospital, getAlertCount);

router
  .route("/hospital/:hospitalID/vitalAlerts/:timeLineID")
  .get(verifyAccess, getVitalAlerts);

// get vital alerts for all patients by customercare hospitals
router
  .route("/getAllVitalAlertsByhospitals")
  .get(verifyAccess, getAllVitalAlertsByhospitals);

router
  .route("/getHospitalAlertsByTimeIntervals/:date")
  .get(verifyAccess, getHospitalAlertsByTimeIntervals);

  
router
.route("/getIndividualAlertsByTimeIntervals/:date")
.get(verifyAccess, getIndividualAlertsByTimeIntervals);

router
  .route("/getcceCountByDateHourly")
  .get(verifyAccess, getVitalAlertsByHour);

  router
  .route("/getIndividualAlertsByDateHourly")
  .get(verifyAccess, getIndividualAlertsByDateHourly);

  router
  .route("/getIndividualAlertsByYearAndMonth")
  .get(verifyAccess, getIndividualAlertsByYearAndMonth);

  router
  .route("/getIndividualHomeCarePatientsVitails/:id")
  .get(verifyAccess, getIndividualHomeCarePatientsVitails);

module.exports = router;
