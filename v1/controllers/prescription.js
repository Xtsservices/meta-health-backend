const {
  serverError,
  missingBody,
  resourceNotFound,
  notAllowed
} = require("../utils/errors");
// const { ROLES_LIST } = require("../utils/roles");
const pool = require("../db/conn");
const patientUtils = require("../utils/patientUtils");
const prescriptionService = require("../services/prescriptionService");

const {
  addPatientMedicineOrder
} = require("../services/medicineInventoryPatientsOrderService");

const medicineInventoryPatientsOrderService = require("../services/medicineInventoryPatientsOrderService");
const {
  prescriptionSchema
} = require("../helper/validators/prescriptionValidator");
const { testSchema } = require("../helper/validators/testValidator");
// const queryForExistingMedicine = `
//   SELECT * FROM prescriptions
//   WHERE hospitalID = ? AND timeLineID = ? AND medicine = ? AND medicineTime = ? AND medicineStartDate = ?
//     AND DATE_ADD(medicineStartDate, INTERVAL medicineDuration DAY) > NOW()
// `;
const queryForExistingMedicine = `
  SELECT * FROM prescriptions
  WHERE hospitalID = ? 
    AND patientID = ? 
    AND medicine = ? 
    AND medicineTime = ? 
    AND (
      (medicineStartDate <= ? AND DATE_ADD(medicineStartDate, INTERVAL medicineDuration - 1 DAY) >= ?)
      OR
      (medicineStartDate >= ? AND medicineStartDate <= DATE_ADD(?, INTERVAL ? - 1 DAY))
    )
`;

const queryInsertPrescription = `INSERT INTO prescriptions (hospitalID,medicine,medicineType,medicineTime,medicineDuration,medicineFrequency,test,timeLineID,patientID,userID,advice,followUp,followUpDate,medicineStartDate, meddosage,dosageUnit) 
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

const queryGetAllPrescription = `SELECT  medicine,medicineType,medicineTime,medicineDuration,medicineFrequency,medicineNotes,test,
notes,diagnosis,timelineID,userID,diet,advice,followUp,followUpDate, medicineStartDate,addedOn FROM prescriptions WHERE hospitalID=? AND timeLineID=? ORDER BY addedOn DESC`;

const queryPatientTimelineByID = `SELECT patientStartStatus,patientEndStatus,patientID FROM patientTimeLine where id=?`;
const queryInsertFollowUp = `INSERT INTO followUp (timelineID,date,status) VALUES (?,?,?)`;
const queryUpdatePreviousFollowUp = `UPDATE followUp SET status=? WHERE timelineID=? AND status=?`;
const queryUpdatePatientTimeLine = `UPDATE patientTimeLine SET patientEndStatus=?,dischargeType=? WHERE id=?`;
const queryUpdatePatientRevisit = `UPDATE patients 
    SET ptype=? 
    WHERE hospitalID=? AND id=?`;
const queryGetFullPatientByID = `SELECT patients.id,patients.hospitalID,patients.deviceID,patients.pID,
    patients.pUHID,patients.ptype,patients.category,patients.pName,users.firstName,users.lastName,departments.name as department,patients.dob,patients.gender,
    patients.weight,patients.height,patients.phoneNumber,patients.email,patients.address,patients.insurance,patients.insuranceNumber,
    patients.insuranceCompany,patients.city,patients.state,patients.pinCode,patients.referredBy,patients.photo,patientTimeLine.startTime,patientTimeLine.endTime,
    patientTimeLine.id AS patientTimeLineID,patientTimeLine.dischargeType,patientTimeLine.diet,patientTimeLine.wardID, patientDoctors.doctorID ,
    patientTimeLine.advice,patientTimeLine.followUp,patientTimeLine.icd,followUp.status AS followUpStatus, followUp.date AS followUpDate, followUp.addedOn AS followUpAddedOn
    FROM patients
    INNER JOIN patientTimeLine on patients.id=patientTimeLine.patientID 
    inner join patientDoctors on patientTimeLine.id = patientDoctors.patientTimeLineID
    INNER JOIN users on  patientDoctors.doctorID=users.id 
    INNER JOIN departments on users.departmentID=departments.id 
    LEFT JOIN followUp on followUp.timelineID=patientTimeLine.id
    WHERE patients.hospitalID=? AND patients.id=? ORDER BY followUpAddedOn DESC LIMIT 1`;

const addPrescription = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  let connection;

  const finalData = req.body.finalData; // Array of prescription objects

  const copy = req.query.copy;
  // Ensure there's data to process
  if (!finalData || finalData.length === 0) {
    return missingBody(res, "No prescription data provided");
  }

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    if (copy && copy === "true") {
      // Update all other prescriptions for this patient to status 0
      const patientID = finalData[0]?.patientID;
      if (!patientID) {
        throw new Error("patientID missing in finalData");
      }

      await connection.query(
        `UPDATE prescriptions 
         SET status = 0 
         WHERE hospitalID = ? AND patientID = ?`,
        [hospitalID, patientID]
      );
    }

    for (const bodyData of finalData) {
      // Add hospitalID to bodyData
      bodyData.hospitalID = hospitalID;

      if (!bodyData.patientID) {
        return missingBody(res, "patientID missing");
      }

      // Validate prescription data using Joi
      await prescriptionSchema.validateAsync(bodyData);

      const latestTimeline = await pool.query(queryPatientTimelineByID, [
        bodyData.timeLineID
      ]);
      if (latestTimeline[0].patientEndStatus) {
        return notAllowed(res, "Patient is not an outpatient");
      }

      // Check if the same medicine and medicine time already exist within the medicine duration
      const existingPrescription = await connection.query(
        queryForExistingMedicine,
        [
          bodyData.hospitalID, // Now using bodyData.hospitalID
          bodyData.patientID,
          bodyData.medicine,
          bodyData.medicineTime,
          bodyData.medicineStartDate,
          bodyData.medicineStartDate,
          bodyData.medicineStartDate,
          bodyData.medicineStartDate,
          bodyData.medicineDuration
        ]
      );
      // Skip checking if copy is true
      if (!copy && existingPrescription[0].length > 0) {
        await connection.release();
        throw new Error(
          "This medicine already added for this medication time within the specified duration"
        );
      }

      // Insert prescription into the database
      const result = await connection.query(queryInsertPrescription, [
        bodyData.hospitalID, // Now using bodyData.hospitalID
        bodyData.medicine,
        bodyData.medicineType,
        bodyData.medicineTime,
        bodyData.medicineDuration,
        bodyData.medicineFrequency,
        bodyData.test,
        bodyData.timeLineID,
        bodyData.patientID,
        bodyData.userID,
        bodyData.advice,
        bodyData.followUp,
        bodyData.followUpDate || null,
        bodyData.medicineStartDate || null,
        bodyData.meddosage,
        bodyData.dosageUnit
      ]);
      // Add patient medicine order to inventory
      if (bodyData.medicine && bodyData.medicine.trim() !== "") {
        medicineInventoryPatientsOrderService.addPatientMedicineOrder([
          {
            timeLineID: bodyData.timeLineID,
            patientID: bodyData.patientID,
            userID: bodyData.userID,
            medicineType: bodyData.medicineType,
            medicineName: bodyData.medicine,
            daysCount: bodyData.medicineDuration,
            doseCount: bodyData.meddosage,
            Frequency: bodyData.medicineFrequency,
            medicationTime: bodyData.medicineTime,
            doseTimings: "",
            notes: bodyData.advice
          }
        ]);
      }

      //adding tests to tests table
      if (bodyData.test && bodyData.test.trim() !== "") {
        // Extract the test names and split them
        const testNames = bodyData.test.split("#").map((test) => test.trim());
        // Generate placeholders dynamically based on the number of test names
        const placeholders = testNames.map(() => "?").join(", ");
        const getTestData = `
    SELECT * 
    FROM LabTests
    WHERE LOINC_Name IN (${placeholders});
`;
        const [testDetails] = await connection.query(getTestData, testNames);

        const validatedsymptoms = await Promise.all(
          testDetails.map(async (item) => {
            const formattedItem = {
              timeLineID: bodyData.timeLineID,
              patientID: bodyData.patientID,
              userID: bodyData.userID,
              test: item.LOINC_Name,
              loinc_num_: item.LOINC_Code,
              department: item.Department,
              testID: item.id
            };
            return await testSchema.validateAsync(formattedItem);
          })
        );

        const queryExistingTests =
          "SELECT COUNT(*) as count FROM tests WHERE timeLineID=? AND test IN (?)";

        const existingsymptoms = await pool.query(queryExistingTests, [
          bodyData.timeLineID,
          testDetails.map((item) => item.LOINC_Name)
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

        const insertTests =
          "INSERT INTO tests(timeLineID,patientID,userID,hospitalID, test, addedOn,loinc_num_,status,alertStatus,category, testID) VALUES ?";
        // Insert all tests into the database
        const addedTests = await pool.query(insertTests, [values]);
      }

      // Handle follow-up and patient timeline updates
      await connection.query(queryUpdatePreviousFollowUp, [
        patientUtils.followUpStatus.end,
        bodyData.timeLineID,
        patientUtils.followUpStatus.active
      ]);

      if (bodyData.followUpDate) {
        await connection.query(queryInsertFollowUp, [
          bodyData.timeLineID,
          bodyData.followUpDate,
          patientUtils.followUpStatus.active
        ]);
      } else {
        await connection.query(queryUpdatePatientTimeLine, [
          patientUtils.patientStatus.discharged,
          patientUtils.dischargeType.success,
          bodyData.timeLineID
        ]);
        await connection.query(queryUpdatePatientRevisit, [
          patientUtils.patientStatus.discharged,
          bodyData.hospitalID, // Using bodyData.hospitalID
          latestTimeline[0][0].patientID
        ]);
      }

      // Fetch and log full patient details
      const patientResult = await connection.query(queryGetFullPatientByID, [
        bodyData.hospitalID, // Using bodyData.hospitalID
        latestTimeline[0][0].patientID
      ]);
    }

    // Commit all changes after processing all prescriptions
    await connection.commit();
    res.status(200).send({
      message: "success",
      prescriptions: finalData // Send all added prescriptions in the response
    });
  } catch (err) {
    if (err.isJoi === true) {
      return missingBody(res, err.message);
    }
    serverError(res, err.message);
  } finally {
    if (connection) connection.release();
  }
};

const getAllPrecription = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const timeLineID = req.params.timelineID;
  const patientID = req.params.patientID;

  if (!timeLineID || !hospitalID) {
    return missingBody(res, "patient type required");
  }
  try {
    const result = await prescriptionService.getAllPrecription(
      hospitalID,
      timeLineID,
      patientID
    );

    res.status(200).send({
      message: "success",
      prescriptions: result
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

module.exports = {
  addPrescription,
  getAllPrecription
};
