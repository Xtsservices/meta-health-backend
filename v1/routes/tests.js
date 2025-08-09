const express = require("express");
const router = express.Router();
const verifyRoles = require("../middleware/verifyRoles");
const verifyAccess = require("../middleware/verifyAccess");
const roles = require("../utils/roles");
const verifyHospital = require("../middleware/verfiyHospital");
const {
  insertTestsList,
  getAllTests,
  getTestFromID,
  deleteTestFromID,
  getAlerts,
  getPatientCountMonthAndYear,
  getPatientCountfullYearFilter,
  getPatientYearCount,
  getAllPatient,
  getPatientDetails,
  testStatus,
  insertTestForNewPatient,
  insertRepeatTest,
  isViewedTest,
  updateAlertsTestStatus,
  addlabTestPricing,
  getlabTestPricing,
  updateLabTestPricing,

  getBillingData,

  getlabTestsdata,
  getWalkinTaxinvoiceData,
  getOpdIpdTaxInvoiceData,

  updateTestPaymentDetails,
  getAllReportsCompletedPatients,
  getReportsCompletedPatientDetails,
  deleteLabTestPricing,
  getWalkinPatientDetails,
  walkinTestStatus,
  getAllWalkinReportsCompletedPatients,
  getWalkinReportsCompletedPatientDetails,
  getWalkinTaxinvoicePatientsData
} = require("../controllers/tests");

router
  .route("/getlabTestPricing/:hospitalID/:department")
  .get(verifyAccess, verifyHospital, getlabTestPricing);
// search suggestions for walkin
router
  .route("/getlabTestsdata/:hospitalID/:department")
  .post(verifyAccess, verifyHospital, getlabTestsdata);
router
  .route("/getWalkinTaxinvoiceData/:hospitalID/:department")
  .get(verifyAccess, verifyHospital, getWalkinTaxinvoiceData);

router
  .route("/getWalkinTaxinvoicePatientsData/:hospitalID/:department")
  .get(verifyAccess, verifyHospital, getWalkinTaxinvoicePatientsData);

//get IPD and OPD TaxInvoice Data
router
  .route("/getOpdIpdTaxInvoiceData/:hospitalID/:department")
  .get(verifyAccess, verifyHospital, getOpdIpdTaxInvoiceData);

router.route("/:patientID").get(verifyAccess, getAllTests);

router.route("/:hospitalID").post(verifyAccess, insertTestsList);

router
  .route("/:roleName/:hospitalID/insertTestForNewPatient")
  .post(verifyAccess, insertTestForNewPatient);

router
  .route("/:timeLineID/:symptomID")
  .get(verifyAccess, getTestFromID)
  .delete(verifyAccess, deleteTestFromID);

router
  .route("/:roleName/:hospitalID/getAlerts")
  .get(verifyAccess, verifyHospital, getAlerts);

//billing(patient orders) ipd and opd
router
  .route("/:roleName/:hospitalID/:status/getBillingData")
  .get(verifyAccess, verifyHospital, getBillingData);

//processing payment(patient orders) ipd and opd
router
  .route("/:roleName/:hospitalID/:patientID/updateTestPaymentDetails")
  .post(verifyAccess, verifyHospital, updateTestPaymentDetails);

router
  .route("/:hospitalID/:category/isviewchange/:id")
  .get(verifyAccess, verifyHospital, isViewedTest);

router
  .route("/:roleName/:hospitalID/getPatientCountMonthAndYear")
  .get(verifyAccess, verifyHospital, getPatientCountMonthAndYear);

router
  .route("/:roleName/:hospitalID/getPatientCountfullYearFilter")
  .get(verifyAccess, verifyHospital, getPatientCountfullYearFilter);

router
  .route("/:roleName/:hospitalID/fullYear")
  .get(verifyAccess, verifyHospital, getPatientYearCount);

router
  .route("/:roleName/:hospitalID/:userID/getAllPatient")
  .get(verifyAccess, verifyHospital, getAllPatient);

router
  .route("/:roleName/:hospitalID/:userID/getAllReportsCompletedPatients")
  .get(verifyAccess, verifyHospital, getAllReportsCompletedPatients);

router
  .route("/:roleName/:hospitalID/:userID/getAllWalkinReportsCompletedPatients")
  .get(verifyAccess, verifyHospital, getAllWalkinReportsCompletedPatients);

router
  .route("/:roleName/:hospitalID/:userID/:timeLineID/getPatientDetails")
  .get(verifyAccess, verifyHospital, getPatientDetails);

router
  .route("/:roleName/:hospitalID/:userID/:timeLineID/getWalkinPatientDetails")
  .get(verifyAccess, verifyHospital, getWalkinPatientDetails);

router
  .route(
    "/:roleName/:hospitalID/:userID/:timeLineID/getReportsCompletedPatientDetails"
  )
  .get(verifyAccess, verifyHospital, getReportsCompletedPatientDetails);

router
  .route(
    "/:roleName/:hospitalID/:userID/:timeLineID/getWalkinReportsCompletedPatientDetails"
  )
  .get(verifyAccess, verifyHospital, getWalkinReportsCompletedPatientDetails);

router
  .route("/:roleName/:hospitalID/:testID/testStatus")
  .post(verifyAccess, verifyHospital, testStatus);

//walkin
router
  .route("/:hospitalID/:loincCode/:walkinID/walkinTestStatus")
  .post(verifyAccess, verifyHospital, walkinTestStatus);

//update alerts status(rejected or approved)
router
  .route("/:roleName/:hospitalID/:status/:patientID")
  .post(verifyAccess, verifyHospital, updateAlertsTestStatus);

//to repeat the test
router
  .route("/repeatTest/:hospitalID/:timelineID/:testID")
  .post(verifyAccess, insertRepeatTest);

// for Radiology and Pathology adding testPrice
router
  .route("/addlabTestPricing/:hospitalID")
  .post(verifyAccess, verifyHospital, addlabTestPricing);

//here updating price,gst,hsn
router
  .route("/updateLabTestPricing/:hospitalID")
  .post(verifyAccess, verifyHospital, updateLabTestPricing);

//here updating isActive and deleteddOn
router
  .route("/deleteLabTestPricing/:hospitalID/:testId")
  .get(verifyAccess, verifyHospital, deleteLabTestPricing);

module.exports = router;
