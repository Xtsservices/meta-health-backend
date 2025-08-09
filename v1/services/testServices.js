const pool = require("../db/conn");
const { testSchema } = require("./../helper/validators/testValidator");
const dayjs = require("dayjs");
const {
  queryExistingTests,
  insertTests,
  queryGetAllTests,
  queryGetTestByID,
  queryDeleteTestsByID,
  queryGetTestsByIDs,
  queryGetAlertsDetails,
  queryGetPatientCountYearAndMonth,
  queryGetPatientCountBetweenDates,
  queryGetAllPatientList,
  queryGetPatientDetails,
  queryUpdateStatus,
  getAllLabTestPridingByHospitalId,
  queryGetBillingDetails,
  queryGetAllReportsCompletedPatientList,
  queryGetReportsCompletedPatientDetails,
  queryGetWalkinPatientDetails,
  queryGetAllWalkinReportsCompletedPatientList,
  queryGetWalkinReportsCompletedPatientDetails
} = require("../queries/testQueries");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand
} = require("@aws-sdk/client-s3");

const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const AWS_BUCKET_REGION = process.env.AWS_BUCKET_REGION;
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;

const s3Client = new S3Client({
  region: AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY
  }
});

const queryPatientCountWithFilter = (filterValue, filter) => {
  let year = new Date().getFullYear();
  let month = new Date().getMonth() + 1;
  if (filter == "year") {
    year = filterValue || new Date().getFullYear();
  }
  if (filter == "month") {
    month = filterValue || new Date().getMonth() + 1;
  }
  return `SELECT
CASE
  WHEN @filterOption = 'year' THEN MONTH(approved_status)
  WHEN @filterOption = 'month' THEN DAY(approved_status) 
  WHEN @filterOption = 'week' THEN DAYOFWEEK(approved_status)
  ELSE NULL
END AS filter_value, COUNT(DISTINCT timeLineID) AS count
FROM patientTimeLine
WHERE
hospitalID=? AND patientStartStatus=? AND 
CASE
  WHEN @filterOption = 'year' THEN YEAR(approved_status) = ${year}
  WHEN @filterOption = 'month' THEN YEAR(approved_status) = YEAR(CURDATE()) AND MONTH(approved_status) = ${month}
  WHEN @filterOption = 'week' THEN YEAR(approved_status) = YEAR(CURDATE()) AND WEEK(approved_status) = WEEK(CURDATE()) AND MONTH(approved_status) = MONTH(CURDATE())
  ELSE FALSE
END
GROUP BY filter_value;`;
};

/**
 * *** METHOD : POST
 * *** DESCRIPTION : insert symptoms list
 */
async function insertTestsList(
  hospitalID,
  timeLineID,
  patientID,
  userID,
  tests
) {
  try {
    const validatedsymptoms = await Promise.all(
      tests.map(async (item) => {
        item.timeLineID = timeLineID;
        item.patientID = patientID;
        item.userID = userID;
        return await testSchema.validateAsync(item);
      })
    );

    const existingsymptoms = await pool.query(queryExistingTests, [
      timeLineID,
      tests.map((item) => item.test)
    ]);
    const existingCount = existingsymptoms[0][0].count;
    if (existingCount > 0)
      throw new Error("one or more tests with same name exist");

    const values = validatedsymptoms.map((item) => {
      return [
        item.timeLineID,
        item.patientID,
        item.userID,
        hospitalID,
        item.test.toLowerCase(),
        new Date(),
        item.loinc_num_,
        "pending",
        "pending",
        item.department,
        item.testID
      ];
    });

    // Insert all tests into the database
    const addedTests = await pool.query(insertTests, [values]);

    const ids = [];
    for (let i = 0; i < values.length; i++) {
      ids.push(addedTests[0].insertId + i);
    }
    const results = await pool.query(queryGetTestsByIDs, [ids]);

    return results[0];
  } catch (err) {
    if (err.isJoi === true) {
      throw new Error(err.message);
    }
    throw new Error(err.message);
  }
}

/**
 * *** METHOD : GET
 * *** DESCRIPTION : get all symptoms from timeLineID
 */
async function getAllTests(patientID) {
  try {
    const results = await pool.query(queryGetAllTests, [patientID]);

    return results[0];
  } catch (err) {
    throw new Error(err.message);
  }
}

/**
 * *** METHOD : GET
 * *** DESCRIPTION : get symptom from symptomID
 */
async function getTestFromID(timeLineID, testID) {
  try {
    const results = await pool.query(queryGetTestByID, [timeLineID, testID]);
    return results[0][0];
  } catch (err) {
    throw new Error(err.message);
  }
}

/**
 * *** METHOD : DELETE
 * *** DESCRIPTION : delete symptom from symptomID
 */
async function deleteTestFromID(timeLineID, symptomID) {
  try {
    const results = await pool.query(queryDeleteTestsByID, [
      timeLineID,
      symptomID
    ]);

    const { affectedRows } = results[0];
    if (!affectedRows) throw new Error("failed to delete");

    return results;
  } catch (err) {
    throw new Error(err.message);
  }
}

const getAlerts = async (hospitalID, roleName) => {
  try {
    const results = await pool.query(queryGetAlertsDetails, [
      hospitalID,
      roleName
    ]);
    const data = results[0];
    const combinedData = data.reduce((acc, item) => {
      const existing = acc.find((el) => el.patientID === item.patientID);

      const testEntry = {
        id: item.id,
        test: item.test,
        addedOn: item.addedOn,
        loinc_num_: item.loinc_num_,
        status: item.status,
        category: item.category,
        alertStatus: item.alertStatus,
        testID: item.testID || 0
      };

      if (existing) {
        existing.testsList.push(testEntry);
        existing.addedOn =
          new Date(existing.addedOn) > new Date(item.addedOn)
            ? existing.addedOn
            : item.addedOn;
      } else {
        // Add all other fields except test-specific fields

        const {
          test,
          loinc_num_,
          status,
          category,
          alertStatus,
          ...patientData
        } = item;

        acc.push({
          ...patientData, // Keep all patient-related details
          addedOn: item.addedOn,
          testsList: [testEntry]
        });
      }

      return acc;
    }, []);

    return combinedData;
  } catch (err) {
    throw new Error(err.message);
  }
};

const getPatientCountMonthAndYear = async (
  hospitalID,
  userID,
  roleName,
  alertStatus
) => {
  try {
    const results = await pool.query(queryGetPatientCountYearAndMonth, [
      hospitalID,
      roleName,
      userID
    ]);
    return results[0];
  } catch (err) {
    throw new Error(err.message);
  }
};

const getPatientCountfullYearFilter = async (
  hospitalID,
  filter,
  filterValue
) => {
  try {
    result = await pool.query(
      queryPatientCountWithFilter(filterValue, filter),
      [hospitalID, ptype]
    );
    return result;
  } catch (err) {
    throw new Error(err.message);
  }
};

//   hospitalID,
//   currentYear,
//   currentMonth,
//   roleName
// ) => {
//   try {
//     const monthCounts = [];
//     const monthNames = [
//       "Jan",
//       "Feb",
//       "Mar",
//       "Apr",
//       "May",
//       "Jun",
//       "Jul",
//       "Aug",
//       "Sep",
//       "Oct",
//       "Nov",
//       "Dec",
//     ];

//     for (let i = 0; i < 12; i++) {
//       const startDate = new Date(currentYear, i, 1);
//       const endDate = new Date(currentYear, i + 1, 1);
//       const result = await pool.query(queryGetPatientCountBetweenDates, [
//         hospitalID,
//         roleName,
//         startDate,
//         endDate,
//       ]);
//       monthCounts.push({
//         month: monthNames[i],
//         count: result[0][0].count,
//       });
//     }
//     return monthCounts;
//   } catch (error) {}
// };

const getPatientYearCount = async (
  hospitalID,
  userID,
  filterYear,
  filterMonth,
  roleName
) => {
  try {
    let result;
    console.log("roleName", roleName);
    // Define queries outside of conditional blocks
    const queryPatientDailyCount = `
  SELECT DAY(tests.addedOn) AS filter_value, COUNT(DISTINCT tests.timeLineID) AS count
  FROM tests
  WHERE
    hospitalID = ?
    AND tests.alertStatus = "approved"
    AND userID = ?
    AND category = ?
    AND YEAR(tests.addedOn) = ?
    AND MONTH(tests.addedOn) = ?
   
  GROUP BY filter_value;
`;

    const queryPatientMonthlyCount = `
    SELECT
      MONTH(tests.addedOn) AS filter_value,
      COUNT(DISTINCT tests.timeLineID) AS count
    FROM tests
    WHERE
      hospitalID = ? 
      AND tests.alertStatus = "approved"
      AND userID = ? 
      AND category = ?
      AND YEAR(tests.addedOn) = ?
    GROUP BY filter_value;
  `;

    // Use the correct query based on filterMonth
    if (filterMonth) {
      result = await pool.query(
        queryPatientDailyCount,
        [hospitalID, userID, roleName, filterYear, filterMonth] // parameters for monthly filter
      );
    } else {
      result = await pool.query(
        queryPatientMonthlyCount,
        [hospitalID, userID, roleName, filterYear] // parameters for yearly filter
      );
    }

    // Returning result in a consistent structure
    return result[0]; // Assuming result is an array of objects and we want the first element
  } catch (error) {
    throw new Error("Error fetching patient year count: " + error.message);
  }
};

const getAllPatient = async (hospitalID, userID, roleName) => {
  try {
    const results = await pool.query(queryGetAllPatientList, [
      hospitalID,
      roleName,
      userID
    ]);
    return results[0];
  } catch (err) {
    throw new Error(err.message);
  }
};

const getPatientDetails = async (hospitalID, userID, roleName, timeLineID) => {
  try {
    const results = await pool.query(queryGetPatientDetails, [
      hospitalID,
      roleName,
      timeLineID
    ]);
    return results[0];
  } catch (err) {
    throw new Error(err.message);
  }
};

const getWalkinPatientDetails = async (
  hospitalID,
  userID,
  roleName,
  timeLineID
) => {
  try {
    const results = await pool.query(queryGetWalkinPatientDetails, [
      hospitalID,

      // userID,
      timeLineID
    ]);
    return results[0];
  } catch (err) {
    throw new Error(err.message);
  }
};

const testStatus = async (hospitalID, roleName, testID, status) => {
  try {
    const result = await pool.query(queryUpdateStatus, [status, testID]);
    if (result.affectedRows > 0) {
      return {
        message: "Success"
      };
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

const walkinTestStatus = async (hospitalID, loincCode, walkinID, status) => {
  try {
    const query = `select * from walkinPatientsTests where hospitalID=? and id=?`;
    const [rows] = await pool.query(query, [hospitalID, walkinID]);
    if (rows.length === 0) {
      return { message: "No matching record found" };
    }

    let testsList = rows[0].testsList || "[]";
    // Find test by loinc_num_ and update status
    let testFound = false;
    testsList = testsList.map((test) => {
      if (test.loinc_num_ === loincCode) {
        test.status = status; // ✅ Update status
        testFound = true;
      }
      return test;
    });

    if (!testFound) {
      return { message: "LoincCode not found in testsList" };
    }

    // Update the testsList JSON in the database
    const updateQuery = `UPDATE walkinPatientsTests SET testsList=? WHERE hospitalID=? AND id=?`;
    const result = await pool.query(updateQuery, [
      JSON.stringify(testsList),
      hospitalID,
      walkinID
    ]);
    if (result.affectedRows > 0) {
      return {
        message: "Success"
      };
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

const insertTestForNewPatient = async (hospitalID, roleName) => {};

const insertRepeatTest = async (hospitalID, timeLineID, id) => {
  try {
    if (!timeLineID) {
      throw new Error("timeLineID is required.");
    }
    if (!id) {
      throw new Error("Test ID is required.");
    }
    // Step 1: Check if the test exists and its status
    const querycheckExistingTests = `SELECT * FROM tests WHERE timeLineID = ? AND hospitalID = ? AND id = ?`;
    const [existingTest] = await pool.query(querycheckExistingTests, [
      timeLineID,
      hospitalID,
      id
    ]);

    // If the test exists and its status is 'completed', repeat the test
    if (
      existingTest &&
      existingTest.length > 0 &&
      existingTest[0].status === "completed"
    ) {
      // Step 2: Prepare the data for the new test record (repeat test)
      const newTest = {
        timeLineID,
        userID: existingTest[0].userID,
        hospitalID,
        test: existingTest[0].test,
        addedOn: new Date(), // Current timestamp for when it's added
        loinc_num_: existingTest[0].loinc_num_,
        status: "pending",
        alertStatus: "pending",
        category: existingTest[0].category,
        patientID: existingTest[0].patientID
      };

      // Step 3: Insert the repeat test record into the database
      const insertTest = `INSERT INTO tests (timeLineID, userID, hospitalID, test, addedOn, loinc_num_, status, alertStatus, category,   patientID)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      await pool.query(insertTest, Object.values(newTest));

      // Step 4: Fetch the inserted test using LAST_INSERT_ID()
      const queryFetchInsertedTest = `SELECT * FROM tests WHERE id = LAST_INSERT_ID()`;
      const [insertedResult] = await pool.query(queryFetchInsertedTest);

      // Return the newly inserted test record
      return insertedResult[0];
    } else {
      throw new Error("Test is not completed, cannot repeat.");
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

const updateAlertsTestStatus = async (
  hospitalID,
  status,
  patientID,
  category,
  rejectReason,
  userID
) => {
  try {
    const getAllTests = `
      SELECT * FROM tests 
      WHERE hospitalID = ? 
      AND patientID = ? 
      AND category = ? 
      AND alertStatus = "pending"
    `;

    const [allTests] = await pool.query(getAllTests, [
      hospitalID,
      patientID,
      category
    ]);

    if (allTests.length === 0) {
      return { status: 404, message: "No pending tests found for the patient" };
    }

    let updateTestsQuery = "";
    let queryParams = [];

    if (status === "rejected") {
      updateTestsQuery = `
        UPDATE tests 
        SET alertStatus = "rejected", rejectedReason = ? 
        WHERE hospitalID = ? 
        AND patientID = ? 
        AND category = ? 
        AND alertStatus = "pending"
      `;
      queryParams = [rejectReason, hospitalID, patientID, category];
    } else if (status === "approved") {
      if (allTests.length > 0) {
        let totalAmount = 0;
        let timelineID = allTests[0].timeLineID;

        for (const test of allTests) {
          const getPriceQuery = `
                SELECT testPrice, gst FROM labTestPricing WHERE labTestID = ?
            `;
          const [pricing] = await pool.query(getPriceQuery, [test.testID]);

          if (pricing.length > 0) {
            const { testPrice, gst } = pricing[0];
            const priceWithGST = testPrice + (testPrice * gst) / 100;
            totalAmount += priceWithGST;
          }
        }

        if (totalAmount > 0) {
          // Check if payment record exists for the patient
          const checkPaymentQuery = `
                SELECT * FROM testPaymentDetails 
                WHERE hospitalID = ? 
                AND patientID = ?
                AND testCategory = ?
            `;
          const [existingPayment] = await pool.query(checkPaymentQuery, [
            hospitalID,
            patientID,
            category
          ]);

          if (existingPayment.length > 0) {
            // Update existing payment record
            const updatePaymentQuery = `
                    UPDATE testPaymentDetails 
                    SET totalAmount = totalAmount + ?, 
                        lastUpdatedOn = CURRENT_TIMESTAMP
                    WHERE hospitalID = ? 
                    AND patientID = ?
                    AND testCategory = ?
                `;
            await pool.query(updatePaymentQuery, [
              totalAmount,
              hospitalID,
              patientID,
              category
            ]);
          } else {
            // Insert new payment record
            const insertPaymentQuery = `
                    INSERT INTO testPaymentDetails (hospitalID, patientID, timelineID, userID, testCategory, totalAmount, paidAmount,  addedOn, lastUpdatedOn)
                    VALUES (?, ?, ?, ?, ?,  ?, 0,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `;

            await pool.query(insertPaymentQuery, [
              hospitalID,
              patientID,
              timelineID,
              userID,
              category,
              totalAmount
            ]);
          }
        }
      }

      updateTestsQuery = `
        UPDATE tests 
        SET alertStatus = "approved" 
        WHERE hospitalID = ? 
        AND patientID = ? 
        AND category = ? 
        AND alertStatus = "pending"
      `;
      queryParams = [hospitalID, patientID, category];
    }

    await pool.query(updateTestsQuery, queryParams);
    return { status: 200, message: `Test status updated to ${status}` };
  } catch (err) {
    throw new Error(err.message);
  }
};

const getlabTestPricing = async (hospitalID, department) => {
  try {
    const results = await pool.query(getAllLabTestPridingByHospitalId, [
      hospitalID,
      department
    ]);
    return { status: 200, data: results[0] };
  } catch (err) {
    throw new Error(err.message);
  }
};
const deleteLabTestPricing = async (hospitalID, testId) => {
  try {
    const timestamp = new Date();
    const query = `UPDATE labTestPricing SET isActive = 0, deletedOn = ?,updatedOn=? WHERE hospitalID = ? AND labTestID = ?`;
    const [result] = await pool.query(query, [
      timestamp,
      timestamp,
      hospitalID,
      testId
    ]);

    if (result.affectedRows > 0) {
      return {
        status: 200,
        message: "Lab test pricing deactivated successfully"
      };
    } else {
      return { status: 404, message: "No matching lab test pricing found" };
    }
  } catch (err) {
    return { status: 500, message: err.message };
  }
};

const getBillingData = async (hospitalID, roleName, status) => {
  try {
    // Fetch billing details
    const results = await pool.query(queryGetBillingDetails, [
      hospitalID,
      roleName,
      status
    ]);
    let data = results[0];

    // Fetch lab test pricing details
    const pricingResults = await pool.query(
      "SELECT labTestID, testPrice, gst, hsn FROM labTestPricing WHERE hospitalID = ?",
      [hospitalID]
    );
    const pricingData = pricingResults[0];

    // Create a mapping of testID to pricing details for quick lookup
    const pricingMap = pricingData.reduce((acc, item) => {
      acc[item.labTestID] = {
        testPrice: item.testPrice,
        gst: item.gst,
        hsn: item.hsn
      };
      return acc;
    }, {});

    // Fetch payment details to exclude patients with paymentDetails & dueAmount = 0
    const paymentResults = await pool.query(
      "SELECT patientID, paymentDetails, dueAmount FROM testPaymentDetails WHERE hospitalID = ? AND testCategory =?",
      [hospitalID, roleName]
    );
    const paymentData = paymentResults[0];

    // Create a set of patientIDs to exclude
    const excludedPatients = new Set();
    paymentData.forEach((payment) => {
      if (
        payment.paymentDetails &&
        payment.paymentDetails.length > 0 &&
        Number(payment.dueAmount) === 0
      ) {
        excludedPatients.add(payment.patientID);
      }
    });
    // Filter out patients who should be excluded
    data = data.filter((item) => !excludedPatients.has(item.patientID));

    // Process and combine data
    const combinedData = Object.values(
      data.reduce((acc, item) => {
        if (!acc[item.patientID]) {
          const {
            test,
            loinc_num_,
            status,
            category,
            alertStatus,
            testID,
            ...patientData
          } = item; // Remove unwanted fields
          acc[item.patientID] = {
            ...patientData,
            testsList: []
          };
        }

        // Fetch pricing details for the test
        const pricing = pricingMap[item.testID] || {
          testPrice: 0,
          gst: 0,
          hsn: null
        };

        // Add test entry
        acc[item.patientID].testsList.push({
          id: item.id,
          userID: item.userID,
          test: item.test,
          addedOn: item.addedOn,
          loinc_num_: item.loinc_num_,
          status: item.status,
          category: item.category,
          alertStatus: item.alertStatus,
          testID: item.testID || 0,
          testPrice: pricing.testPrice,
          gst: pricing.gst,
          hsn: pricing.hsn
        });

        // Update addedOn to the latest date
        acc[item.patientID].addedOn =
          new Date(acc[item.patientID].addedOn) > new Date(item.addedOn)
            ? acc[item.patientID].addedOn
            : item.addedOn;

        return acc;
      }, {})
    );

    return combinedData;
  } catch (err) {
    throw new Error(err.message);
  }
};

const getlabTestsdata = async (hospitalID, department, text) => {
  const fetch_lionic = `  SELECT
      lp.testPrice,
      lp.gst,
      lt.LOINC_Name,
      lt.LOINC_Code
    FROM labTestPricing lp
    LEFT JOIN LabTests lt ON lp.labTestID = lt.id
    WHERE lp.hospitalID = ?
      AND lt.Department = ?
      AND LOWER(lt.LOINC_Name) LIKE LOWER(CONCAT(?, '%'))
    LIMIT 100`;
  try {
    const results = await pool.query(fetch_lionic, [
      hospitalID,
      department,
      text
    ]);
    return results[0];
  } catch (err) {
    throw new Error(err.message);
  }
};

const getWalkinTaxinvoiceData = async (
  hospitalID,
  department,
  startDate,
  endDate
) => {
  try {
    const formattedStartDate = startDate
      ? dayjs(startDate).format("YYYY-MM-DD")
      : null;
    const formattedEndDate = endDate
      ? dayjs(endDate).format("YYYY-MM-DD")
      : null;

    let getWalkinTaxinvoiceDataquery = `
    SELECT * 
FROM walkinPatientsTests
WHERE hospitalID=?
 AND department=?
 
`;

    let queryParams = [hospitalID, department];

    if (formattedStartDate && formattedEndDate) {
      getWalkinTaxinvoiceDataquery += ` AND DATE(walkinPatientsTests.updatedOn)  BETWEEN ? AND ? `;
      queryParams.push(formattedStartDate, formattedEndDate);
    }
    // Order by should be outside of WHERE conditions
    getWalkinTaxinvoiceDataquery += ` ORDER BY id DESC`;
    let response = await pool.query(getWalkinTaxinvoiceDataquery, queryParams);

    let results = response[0] || [];

    results = await Promise.all(
      results.map(async (order) => {
        if (order.fileName) {
          order.prescriptionURL = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: order.fileName
            }),
            { expiresIn: 3600 }
          );
        } else {
          order.prescriptionURL = null;
        }
        return order;
      })
    );

    console.log("getWalkinTaxinvoiceDataquery", results);

    return { status: 200, data: results };
  } catch (err) {
    console.error("Error in getWalkinTaxinvoiceData:", err.message);
    throw new Error(err.message);
  }
};

const getWalkinTaxinvoicePatientsData = async (
  hospitalID,
  department,
  startDate,
  endDate
) => {
  try {
    const formattedStartDate = startDate
      ? dayjs(startDate).format("YYYY-MM-DD")
      : null;
    const formattedEndDate = endDate
      ? dayjs(endDate).format("YYYY-MM-DD")
      : null;

    let getWalkinTaxinvoiceDataquery = `
    SELECT * 
FROM walkinPatientsTests
WHERE hospitalID = ?
  AND department = ?
  AND (
    JSON_SEARCH(testsList, 'one', 'pending') IS NOT NULL
    OR JSON_SEARCH(testsList, 'one', 'processing') IS NOT NULL
  ) 
`;

    let queryParams = [hospitalID, department];

    if (formattedStartDate && formattedEndDate) {
      getWalkinTaxinvoiceDataquery += ` AND DATE(walkinPatientsTests.updatedOn)  BETWEEN ? AND ? `;
      queryParams.push(formattedStartDate, formattedEndDate);
    }
    // Order by should be outside of WHERE conditions
    getWalkinTaxinvoiceDataquery += ` ORDER BY id DESC`;
    let response = await pool.query(getWalkinTaxinvoiceDataquery, queryParams);

    let results = response[0] || [];

    results = await Promise.all(
      results.map(async (order) => {
        if (order.fileName) {
          order.prescriptionURL = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: order.fileName
            }),
            { expiresIn: 3600 }
          );
        } else {
          order.prescriptionURL = null;
        }
        return order;
      })
    );

    return { status: 200, data: results };
  } catch (err) {
    console.error("Error in getWalkinTaxinvoicePatientsData:", err.message);
    throw new Error(err.message);
  }
};

const updateTestPaymentDetails = async (
  hospitalID,
  roleName,
  patientID,
  paymentMethod,
  paidAmount,
  discount
) => {
  try {
    // Fetch existing payment details
    const checkPaymentQuery = `
            SELECT * FROM testPaymentDetails 
            WHERE hospitalID = ? 
            AND patientID = ? 
            AND testCategory = ?
        `;
    const [existingPayment] = await pool.query(checkPaymentQuery, [
      hospitalID,
      patientID,
      roleName
    ]);

    if (existingPayment.length === 0) {
      return { status: 404, message: "No existing payment record found" };
    }

    const paymentRecord = existingPayment[0];
    // Parse existing payment details JSON
    let paymentDetails = paymentRecord.paymentDetails
      ? paymentRecord.paymentDetails
      : "[]";
    let discountDetails = paymentRecord.discount
      ? paymentRecord.discount
      : "[]";
    // Ensure paymentDetails and discountDetails are arrays
    if (!Array.isArray(paymentDetails)) paymentDetails = [];
    if (!Array.isArray(discountDetails)) discountDetails = [];

    // 3. Append new payment entry with timestamp
    const newPaymentEntry = {
      ...paymentMethod,
      timestamp: new Date().toISOString() // Add timestamp for tracking
    };
    paymentDetails.push(newPaymentEntry);
    // Add new discount entry
    if (discount) {
      discountDetails.push(discount);
    }

    // Calculate total discount percentage
    const totalDiscountPercentage = discountDetails.reduce(
      (acc, item) => acc + (item.discount || 0),
      0
    );

    // Calculate the discount amount
    const discountedAmount =
      (paymentRecord.totalAmount * totalDiscountPercentage) / 100;

    // Calculate new due amount
    const newPaidAmount = Number(paymentRecord.paidAmount) + Number(paidAmount);

    const newDueAmount =
      paymentRecord.totalAmount - (newPaidAmount + discountedAmount);

    // Update payment details and paid amount
    const updatePaymentQuery = `
                UPDATE testPaymentDetails 
                SET paymentDetails = ?, discount=?,
                    paidAmount = ?, 
                    dueAmount = ?,  
                    lastUpdatedOn = CURRENT_TIMESTAMP
                WHERE hospitalID = ? 
                AND patientID = ? 
                AND testCategory = ?
            `;

    await pool.query(updatePaymentQuery, [
      JSON.stringify(paymentDetails),
      JSON.stringify(discountDetails),
      newPaidAmount,
      newDueAmount,
      hospitalID,
      patientID,
      roleName
    ]);

    return { status: 200, message: "Payment details updated successfully" };
  } catch (error) {
    console.error("Error updating test payment details:", error);
    return { status: 500, message: "Internal Server Error" };
  }
};

const getOpdIpdTaxInvoiceData = async (
  hospitalID,
  department,
  startDate,
  endDate
) => {
  try {
    const formattedStartDate = startDate
      ? dayjs(startDate).format("YYYY-MM-DD")
      : null;
    const formattedEndDate = endDate
      ? dayjs(endDate).format("YYYY-MM-DD")
      : null;

    let getOpdIpdTaxInvoiceDataQuery = `
    SELECT
  p.id AS patientID,
     p.pName,
     u.firstName as firstName,
       u.firstName as lastName,
  t.addedOn,
   lt.id AS testID,
    lt.LOINC_Name AS testName,
    pt.patientStartStatus as departmemtType,
    ltp.testPrice,
    ltp.gst,
    tp.hospitalID as hospitalID,
    lt.Department as category,
    tp.discount,
    tp.lastUpdatedOn
 
FROM testPaymentDetails AS tp
LEFT JOIN patients AS p ON tp.patientID = p.id
LEFT JOIN users AS u ON tp.userID = u.id
LEFT JOIN tests AS t ON tp.patientID = t.patientID
LEFT JOIN LabTests AS lt ON t.testID = lt.id
LEFT JOIN labTestPricing AS ltp ON t.testID = ltp.labTestID
LEFT JOIN patientTimeLine AS pt ON t.timeLineID = pt.id
WHERE tp.hospitalID = ?
AND tp.dueAmount <1
AND lt.Department = ?
`;

    let queryParams = [hospitalID, department];

    // if (formattedStartDate !== null || formattedStartDate !== "") {
    //   getOpdIpdTaxInvoiceDataQuery += ` AND DATE(tp.addedOn) = ?`;
    //   queryParams.push(formattedDate);
    // }

    if (formattedStartDate && formattedEndDate) {
      getOpdIpdTaxInvoiceDataQuery += ` AND DATE(tp.addedOn) BETWEEN ? AND ?`;
      queryParams.push(formattedStartDate, formattedEndDate);
    }

    let response = await pool.query(getOpdIpdTaxInvoiceDataQuery, queryParams);

    let results = response[0] || [];
    const combinedData = results.reduce((acc, item) => {
      const existing = acc.find((el) => el.patientID === item.patientID);

      const testEntry = {
        testID: item.testID,
        testName: item.testName,
        testPrice: item.testPrice,
        gst: item.gst
      };

      if (existing) {
        existing.testsList.push(testEntry);
      } else {
        // Add all other fields except test-specific fields
        const { testName, testID, testPrice, gst, ...patientData } = item;
        acc.push({
          ...patientData, // Keep all patient-related details
          addedOn: item.addedOn,
          testsList: [testEntry]
        });
      }

      return acc;
    }, []);

    return { status: 200, data: combinedData };
  } catch (err) {
    console.error("Error:", err.message);
    throw new Error(err.message);
  }
};

const getAllReportsCompletedPatients = async (hospitalID, userID, roleName) => {
  try {
    const results = await pool.query(queryGetAllReportsCompletedPatientList, [
      hospitalID,
      roleName,
      userID
    ]);
    return results[0];
  } catch (err) {
    throw new Error(err.message);
  }
};

const getAllWalkinReportsCompletedPatients = async (
  hospitalID,
  userID,
  roleName
) => {
  try {
    const results = await pool.query(
      queryGetAllWalkinReportsCompletedPatientList,
      [hospitalID, roleName]
    );
    return results[0];
  } catch (err) {
    throw new Error(err.message);
  }
};

const getReportsCompletedPatientDetails = async (
  hospitalID,
  userID,
  roleName,
  timeLineID
) => {
  try {
    // Fetch completed reports
    const [reportResults] = await pool.query(
      queryGetReportsCompletedPatientDetails,
      [hospitalID, roleName, timeLineID]
    );

    if (!reportResults.length) {
      return { message: "No completed reports found", data: [] };
    }
    const queryGetAttachmentsByPatientTest = `
  SELECT a.*, t.test 
FROM attachments a
JOIN tests t ON a.testID = t.id
WHERE a.patientID = ? AND a.testID = ?;
`;

    // Fetch attachments for each test in the report
    for (const report of reportResults) {
      const [attachmentResults] = await pool.query(
        queryGetAttachmentsByPatientTest,
        [
          report.patientID,
          report.id // Match `patientID` and `testID`
        ]
      );

      // Generate signed URLs for attachments
      const attachments = await Promise.all(
        attachmentResults.map(async (item) => {
          const fileURL = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: item.givenName
            }),
            { expiresIn: 300 }
          );
          return { ...item, fileURL };
        })
      );

      report.attachments = attachments;
    }

    return reportResults;
  } catch (err) {
    console.error("Error fetching completed reports:", err);
    throw new Error(err.message);
  }
};

const getWalkinReportsCompletedPatientDetails = async (
  hospitalID,
  userID,
  roleName,
  timeLineID
) => {
  try {
    // Fetch completed reports
    const [reportResults] = await pool.query(
      queryGetWalkinReportsCompletedPatientDetails,
      [hospitalID, roleName, timeLineID]
    );

    if (!reportResults.length) {
      return { message: "No completed reports found", data: [] };
    }
    const queryGetAttachmentsByPatientTest = `
  SELECT 
    a.*, 
    JSON_UNQUOTE(
        JSON_EXTRACT(wpt.testsList, '$[*].name')
    ) AS testName
FROM walkinTestAttachments a
JOIN walkinPatientsTests wpt ON a.walkinId = wpt.id
WHERE wpt.id = ? 
  AND JSON_CONTAINS(wpt.testsList, JSON_OBJECT('loinc_num_', a.loincCode))
  AND JSON_CONTAINS(wpt.testsList, '{"status": "completed"}');

`;

    // Fetch attachments for each test in the report
    for (const report of reportResults) {
      const [attachmentResults] = await pool.query(
        queryGetAttachmentsByPatientTest,
        [
          report.id // Match `patientID` and `testID`
        ]
      );

      // Generate signed URLs for attachments
      const attachments = await Promise.all(
        attachmentResults.map(async (item) => {
          const fileURL = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: item.givenName
            }),
            { expiresIn: 300 }
          );
          return { ...item, fileURL };
        })
      );

      report.attachments = attachments;
    }

    return reportResults;
  } catch (err) {
    console.error("Error fetching completed reports:", err);
    throw new Error(err.message);
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
  updateAlertsTestStatus,
  getlabTestPricing,
  getBillingData,
  getlabTestsdata,
  updateTestPaymentDetails,
  getWalkinTaxinvoiceData,
  getOpdIpdTaxInvoiceData,
  getAllReportsCompletedPatients,
  getReportsCompletedPatientDetails,
  getWalkinPatientDetails,
  walkinTestStatus,
  getAllWalkinReportsCompletedPatients,
  getWalkinReportsCompletedPatientDetails,
  getWalkinTaxinvoicePatientsData
};
