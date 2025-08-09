const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord
} = require("../utils/errors");
const testService = require("../services/testServices");
const pool = require("../db/conn");
const { testPricingSchema } = require("../helper/validators/testValidator");
/**
 * *** METHOD : POST
 * *** DESCRIPTION : insert symptoms list
 */
const insertTestsList = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const { timeLineID, userID, tests, patientID } = req.body;
    if (!tests || tests.length === 0)
      return missingBody(res, "no tests have been added");

    const results = await testService.insertTestsList(
      hospitalID,
      timeLineID,
      patientID,
      userID,
      tests
    );

    res.status(201).send({
      message: "success",
      tests: results
    });
  } catch (err) {
    if (err.isJoi === true) {
      return missingBody(res, err.message);
    }
    serverError(res, err.message);
  }
};

/**
 * *** METHOD : GET
 * *** DESCRIPTION : get all symptoms from timeLineID
 */
const getAllTests = async (req, res) => {
  const patientID = req.params.patientID;
  if (!patientID) return missingBody(res, "missing patientID");
  try {
    const results = await testService.getAllTests(patientID);
    res.status(200).send({
      message: "success",
      tests: results
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * *** METHOD : GET
 * *** DESCRIPTION : get symptom from symptomID
 */
const getTestFromID = async (req, res) => {
  const timeLineID = req.params.timeLineID;
  const testID = req.params.testID;
  if (!timeLineID) return missingBody(res, "missing timeLineID");
  try {
    const results = await testService.getTestFromID(timeLineID, testID);

    res.status(200).send({
      message: "success",
      symptoms: results
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * *** METHOD : DELETE
 * *** DESCRIPTION : delete symptom from symptomID
 */
const deleteTestFromID = async (req, res) => {
  const timeLineID = req.params.timeLineID;
  const symptomID = req.params.symptomID;
  if (!timeLineID) return missingBody(res, "missing timeLineID");

  try {
    const results = await testService.deleteTestFromID(timeLineID, symptomID);

    res.status(200).send({
      message: "success",
      results
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getAlerts = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const roleName = req.params.roleName;
  if (!roleName) return missingBody(res, "missing roleName");
  if (!hospitalID) return missingBody(res, "missing hospitalID");
  try {
    const alerts = await testService.getAlerts(hospitalID, roleName);
    res.status(200).send({
      message: "success",
      alerts
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const isViewedTest = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const id = req.params.id;
  const category = req.params.category;
  const queryUpdateIsViewed = `
UPDATE tests

SET tests.isViewed = 1
WHERE tests.hospitalID = ?
  AND tests.category = ?
  AND tests.isViewed = 0
  AND tests.timeLineID = ?;
`;

  try {
    const [result] = await pool.query(queryUpdateIsViewed, [
      hospitalID,
      category,
      id
    ]);

    if (result.affectedRows > 0) {
      res.status(200).json({
        message: "success",
        status: 0
      });
    } else {
      res.status(404).json({
        message: "Patient not found or already viewed.",
        status: 1
      });
    }
  } catch (err) {
    serverError(res, err.message);
  }
};

const getPatientCountMonthAndYear = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const roleName = req.params.roleName;
  const userID = req.userID;
  if (!hospitalID) return missingBody(res, "missing hospitalID");
  if (!roleName) return missingBody(res, "missing roleName");

  try {
    const count = await testService.getPatientCountMonthAndYear(
      hospitalID,
      userID,
      roleName,
      "approved"
    );
    res.status(200).send({
      message: "success",
      count
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getPatientCountfullYearFilter = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const filter = req.query.filter || "month";
  const filterValue = req.query.filterValue;

  try {
    const result = await testService.getPatientCountfullYearFilter(
      hospitalID,
      filter,
      filterValue
    );
    res.status(200).send({
      message: "success",
      counts: result[0]
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getPatientYearCount = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const roleName = req.params.roleName;
  const filterYear = req.query.filterYear || new Date().getFullYear(); // default to current year
  const filterMonth = req.query.filterMonth; // optional month parameter
  const userID = req.userID;
  if (!roleName) return missingBody(res, "missing roleName");

  try {
    const monthCounts = await testService.getPatientYearCount(
      hospitalID,
      userID,
      filterYear,
      filterMonth,
      roleName
    );

    res.status(200).send({
      message: "success",
      counts: monthCounts
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getAllPatient = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const roleName = req.params.roleName;
  const userID = req.params.userID;
  if (!hospitalID) return missingBody(res, "missing hospitalID");
  if (!userID) return missingBody(res, "missing userID");
  if (!roleName) return missingBody(res, "missing roleName");

  try {
    const patientList = await testService.getAllPatient(
      hospitalID,
      userID,
      roleName
    );

    res.status(200).send({
      message: "success",
      patientList: patientList
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getPatientDetails = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const userID = req.params.userID;
  const timeLineID = req.params.timeLineID;
  const roleName = req.params.roleName;
  if (!hospitalID) return missingBody(res, "missing hospitalID");
  if (!userID) return missingBody(res, "missing userID");
  if (!timeLineID) return missingBody(res, "missing timeLineID");
  if (!roleName) return missingBody(res, "missing roleName");
  try {
    const patientList = await testService.getPatientDetails(
      hospitalID,
      userID,
      roleName,
      timeLineID
    );

    res.status(200).send({
      message: "success",
      patientList: patientList
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getWalkinPatientDetails = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const userID = req.params.userID;
  const timeLineID = req.params.timeLineID;
  const roleName = req.params.roleName;
  if (!hospitalID) return missingBody(res, "missing hospitalID");
  if (!userID) return missingBody(res, "missing userID");
  if (!timeLineID) return missingBody(res, "missing walkinID");
  if (!roleName) return missingBody(res, "missing roleName");
  try {
    const patientList = await testService.getWalkinPatientDetails(
      hospitalID,
      userID,
      roleName,
      timeLineID
    );

    res.status(200).send({
      message: "success",
      patientList: patientList
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const testStatus = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const roleName = req.params.roleName;
  const testID = req.params.testID;
  const status = req.body.status;

  try {
    const testStatus = await testService.testStatus(
      hospitalID,
      roleName,
      testID,
      status
    );

    res.status(200).send({
      message: "success"
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const walkinTestStatus = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const loincCode = req.params.loincCode;
  const walkinID = req.params.walkinID;
  const status = req.body.status;

  try {
    const testStatus = await testService.walkinTestStatus(
      hospitalID,
      loincCode,
      walkinID,
      status
    );

    res.status(200).send({
      message: "success"
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const insertTestForNewPatient = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const roleName = req.params.roleName;

  try {
    const test = await testService.insertTestForNewPatient(
      hospitalID,
      roleName
    );

    res.status(200).send({
      message: "success"
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const insertRepeatTest = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const timeLineID = req.params.timelineID;
    const id = req.params.testID;

    const results = await testService.insertRepeatTest(
      hospitalID,
      timeLineID,
      id
    );

    res.status(201).send({
      message: "success",
      tests: results
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const updateAlertsTestStatus = async (req, res) => {
  const { hospitalID, status, patientID, roleName } = req.params;
  const userID = req.userID;
  const { rejectReason } = req.body;

  if (!hospitalID) return missingBody(res, "missing hospitalID");
  if (!status) return missingBody(res, "missing status");
  if (!patientID) return missingBody(res, "missing patientID");

  // Validate status before proceeding
  const allowedStatuses = ["approved", "rejected"];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status provided" });
  }

  try {
    const patientList = await testService.updateAlertsTestStatus(
      hospitalID,
      status,
      patientID,
      roleName, // Ensure roleName is correctly used as category
      rejectReason,
      userID
    );

    return res.status(patientList.status).json({
      status: patientList.status, // Include status in response body
      message: patientList.message
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const addlabTestPricing = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const { testPricingData } = req.body;

    if (!Array.isArray(testPricingData) || testPricingData.length === 0) {
      return res
        .status(400)
        .json({ error: "Test pricing data must be a non-empty array." });
    }

    // Validate each test pricing entry using Joi
    for (const test of testPricingData) {
      const { error } = testPricingSchema.validate(test);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }
    }

    // Extract labTestIDs from testPricingData
    const labTestIDs = testPricingData.map((test) => test.id);

    // Fetch existing test pricing data for the hospital
    const queryFetchExisting = `
      SELECT labTestID FROM labTestPricing WHERE hospitalID = ? AND labTestID IN (?)
    `;
    const [existingTests] = await pool.query(queryFetchExisting, [
      hospitalID,
      labTestIDs
    ]);

    // Create a Set of existing labTestIDs
    const existingLabTestIDs = new Set(
      existingTests.map((test) => test.labTestID)
    );

    // Filter out tests that already exist for this hospital
    const newTests = testPricingData.filter(
      (test) => !existingLabTestIDs.has(test.id)
    );

    if (newTests.length === 0) {
      return res
        .status(400)
        .json({ error: "All provided tests already exist for this hospital." });
    }

    // Insert new test pricing records
    const insertQuery = `
      INSERT INTO labTestPricing (hospitalID, labTestID, testPrice, gst, hsn, addedOn, updatedOn) 
      VALUES ?
    `;

    const values = newTests.map((test) => [
      hospitalID,
      test.id,
      test.testPrice,
      test.gst,
      test.hsn,
      new Date(),
      new Date()
    ]);

    await pool.query(insertQuery, [values]);

    return res.status(200).json({ status: 200, message: "success" });
  } catch (err) {
    console.error("Error in addLabTestPricing:", err);
    return res
      .status(500)
      .json({
        status: 200,
        message: "Internal Server Error",
        error: err.message
      });
  }
};

//getlabTestPricing
const getlabTestPricing = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const department = req.params.department;
  if (!hospitalID) return missingBody(res, "missing hospitalID");

  try {
    const testPricingList = await testService.getlabTestPricing(
      hospitalID,
      department
    );

    console.log("testPricingList", testPricingList);
    res.status(200).send({
      message: "success",
      testPricingList: testPricingList
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

//getlabTestsdata search suggestions for walking
const getlabTestsdata = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const department = req.params.department;
  const { text } = req.body;

  if (!hospitalID) return missingBody(res, "missing hospitalID");
  if (!department) return missingBody(res, "missing department");
  if (!text) return missingBody(res, "missing text");

  try {
    const testList = await testService.getlabTestsdata(
      hospitalID,
      department,
      text
    );

    res.status(200).send({
      message: "success",
      data: testList
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const updateLabTestPricing = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const { testPricingData } = req.body;

    console.log("testPricingData", testPricingData);

    if (!testPricingData || typeof testPricingData !== "object") {
      return res
        .status(400)
        .json({ error: "Test pricing data must be a valid object." });
    }

    // Validate the single test pricing entry using Joi
    const { error } = testPricingSchema.validate(testPricingData);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Extract labTestID from testPricingData
    const labTestID = testPricingData.id;

    // Fetch existing test pricing data for the hospital
    const queryFetchExisting = `
      SELECT labTestID FROM labTestPricing WHERE hospitalID = ? AND labTestID = ?;
    `;
    const [existingTests] = await pool.query(queryFetchExisting, [
      hospitalID,
      labTestID
    ]);

    if (existingTests.length === 0) {
      return res
        .status(400)
        .json({ error: "The provided test does not exist for this hospital." });
    }

    // Update the existing test pricing record
    const updateQuery = `
      UPDATE labTestPricing
      SET testPrice = ?, gst = ?, hsn = ?, updatedOn = ?
      WHERE hospitalID = ? AND labTestID = ?;
    `;

    await pool.query(updateQuery, [
      testPricingData.testPrice,
      testPricingData.gst,
      testPricingData.hsn,
      new Date(),
      hospitalID,
      labTestID
    ]);

    return res.status(200).json({ status: 200, message: "success" });
  } catch (err) {
    console.error("Error in updateLabTestPricing:", err);
    return res
      .status(500)
      .json({
        status: 500,
        message: "Internal Server Error",
        error: err.message
      });
  }
};

const deleteLabTestPricing = async (req, res) => {
  const { hospitalID, testId } = req.params;
  if (!hospitalID) return missingBody(res, "missing hospitalID");
  if (!testId) return missingBody(res, "missing roleName");

  try {
    const result = await testService.deleteLabTestPricing(hospitalID, testId);
    return res.status(result.status).send(result);
  } catch (err) {
    serverError(res, err.message);
  }
};

const getBillingData = async (req, res) => {
  const { roleName, hospitalID, status } = req.params;
  if (!roleName) return missingBody(res, "missing roleName");
  if (!hospitalID) return missingBody(res, "missing hospitalID");
  if (!status) return missingBody(res, "missing status");

  try {
    const billingData = await testService.getBillingData(
      hospitalID,
      roleName,
      status
    );
    res.status(200).send({
      message: "success",
      billingData
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const updateTestPaymentDetails = async (req, res) => {
  const { hospitalID, patientID, roleName } = req.params;
  const { paymentMethod, paidAmount, discount } = req.body;

  if (!hospitalID) return missingBody(res, "hospitalID is missing");
  if (!paidAmount) return missingBody(res, "paidAmount is missing");
  if (!patientID) return missingBody(res, "patientID is missing");
  try {
    const result = await testService.updateTestPaymentDetails(
      hospitalID,
      roleName,
      patientID,
      paymentMethod,
      paidAmount,
      discount
    );

    return res.status(result.status).send(result);
  } catch (err) {
    serverError(res, err.message);
  }
};
//getWalkinTaxinvoiceData
const getWalkinTaxinvoiceData = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const department = req.params.department;
  let { startDate, endDate } = req.query;
  if (!hospitalID) return missingBody(res, "missing hospitalID");
  if (!department) return missingBody(res, "missing department");
  if (startDate && !endDate) {
    endDate = startDate;
  }

  try {
    const result = await testService.getWalkinTaxinvoiceData(
      hospitalID,
      department,
      startDate,
      endDate
    );
    return res.status(result.status).send(result);
  } catch (err) {
    serverError(res, err.message);
  }
};

const getWalkinTaxinvoicePatientsData = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const department = req.params.department;
  let { startDate, endDate } = req.query;
  if (!hospitalID) return missingBody(res, "missing hospitalID");
  if (!department) return missingBody(res, "missing department");
  if (startDate && !endDate) {
    endDate = startDate;
  }

  try {
    const result = await testService.getWalkinTaxinvoicePatientsData(
      hospitalID,
      department,
      startDate,
      endDate
    );
    return res.status(result.status).send(result);
  } catch (err) {
    serverError(res, err.message);
  }
};

//getOpdIpdTaxInvoiceData
const getOpdIpdTaxInvoiceData = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const department = req.params.department;
  let { startDate, endDate } = req.query;
  if (!hospitalID) return missingBody(res, "missing hospitalID");
  if (!department) return missingBody(res, "missing department");

  if (startDate && !endDate) {
    endDate = startDate;
  }
  try {
    const result = await testService.getOpdIpdTaxInvoiceData(
      hospitalID,
      department,
      startDate,
      endDate
    );
    return res.status(result.status).send(result);
  } catch (err) {
    serverError(res, err.message);
  }
};

const getAllReportsCompletedPatients = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const roleName = req.params.roleName;
  const userID = req.params.userID;
  if (!hospitalID) return missingBody(res, "missing hospitalID");
  if (!userID) return missingBody(res, "missing userID");
  if (!roleName) return missingBody(res, "missing roleName");

  try {
    const patientList = await testService.getAllReportsCompletedPatients(
      hospitalID,
      userID,
      roleName
    );

    res.status(200).send({
      message: "success",
      patientList: patientList
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getAllWalkinReportsCompletedPatients = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const roleName = req.params.roleName;
  const userID = req.params.userID;
  if (!hospitalID) return missingBody(res, "missing hospitalID");
  if (!userID) return missingBody(res, "missing userID");
  if (!roleName) return missingBody(res, "missing roleName");

  try {
    const patientList = await testService.getAllWalkinReportsCompletedPatients(
      hospitalID,
      userID,
      roleName
    );

    res.status(200).send({
      message: "success",
      patientList: patientList
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getReportsCompletedPatientDetails = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const userID = req.params.userID;
  const timeLineID = req.params.timeLineID;
  const roleName = req.params.roleName;
  if (!hospitalID) return missingBody(res, "missing hospitalID");
  if (!userID) return missingBody(res, "missing userID");
  if (!timeLineID) return missingBody(res, "missing timeLineID");
  if (!roleName) return missingBody(res, "missing roleName");
  try {
    const patientList = await testService.getReportsCompletedPatientDetails(
      hospitalID,
      userID,
      roleName,
      timeLineID
    );

    res.status(200).send({
      message: "success",
      patientList: patientList
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getWalkinReportsCompletedPatientDetails = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const userID = req.params.userID;
  const timeLineID = req.params.timeLineID;
  const roleName = req.params.roleName;
  if (!hospitalID) return missingBody(res, "missing hospitalID");
  if (!userID) return missingBody(res, "missing userID");
  if (!timeLineID) return missingBody(res, "missing timeLineID");
  if (!roleName) return missingBody(res, "missing roleName");
  try {
    const patientList =
      await testService.getWalkinReportsCompletedPatientDetails(
        hospitalID,
        userID,
        roleName,
        timeLineID
      );

    res.status(200).send({
      message: "success",
      patientList: patientList
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

module.exports = {
  deleteLabTestPricing,
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
  getWalkinPatientDetails,
  walkinTestStatus,
  getAllWalkinReportsCompletedPatients,
  getWalkinReportsCompletedPatientDetails,
  getWalkinTaxinvoicePatientsData
};
