const pool = require("../db/conn");
const {
  medicalHistorySchema
} = require("../helper/validators/historyValidator");
const {
  insertMedicalHistory,
  queryFindPatientByID,
  queryGetMedicalHistoryByPatientID,
  queryGetMedicalHistoryByID
} = require("../queries/medicalHistoryQueries");

/**
 * ** METHOD : GET
 * ** DESCRIPTION : get Medical History of patient from patient ID
 */
const getMedicalHistoryByID = async (id) => {
  try {
    const results = await pool.query(queryGetMedicalHistoryByID, [id]);
    if (!results[0][0]) throw new Error("Failed to get medical history");
    return results[0][0];
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * ** METHOD : POST
 * ** DESCRIPTION : ADD PATIENT MEDICAL HISTORY
 */
const addMedicalHistory = async (hospitalID, patientID, historyData) => {
  try {
    await medicalHistorySchema.validateAsync(historyData);
    const patient = await pool.query(queryFindPatientByID, [
      hospitalID,
      patientID
    ]);
    if (!patient[0][0]) throw new Error("no patient with id exists");

    const addedRecord = await pool.query(insertMedicalHistory, [
      patientID,
      historyData.userID,
      historyData.givenName,
      historyData.givenPhone,
      historyData.givenRelation,
      historyData.bloodGroup,
      historyData.bloodPressure,
      historyData.disease,
      historyData.foodAllergy,
      historyData.medicineAllergy,
      historyData.anaesthesia,
      historyData.meds,
      historyData.selfMeds,
      historyData.chestCondition,
      historyData.neurologicalDisorder,
      historyData.heartProblems,
      historyData.infections,
      historyData.mentalHealth,
      historyData.drugs,
      historyData.pregnant,
      historyData.hereditaryDisease,
      historyData.lumps,
      historyData.cancer
    ]);
    historyData.id = addedRecord[0].insertId;

    return historyData;
  } catch (err) {
    if (err.isJoi === true) throw new Error(err.message);

    throw new Error(err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : get Medical History of patient from patient ID
 */
const getMedicalHistoryByPatientID = async (patientID) => {
  try {
    const results = await pool.query(queryGetMedicalHistoryByPatientID, [
      patientID
    ]);
    // if (!results[0][0]) throw new Error("Failed to get medical history");
    return results[0][0];
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * ** METHOD : PATCH
 * ** DESCRIPTION : EDIT PATIENT MEDICAL HISTORY
 */
const editMedicalHistoryByID = async (
  hospitalID,
  patientID,
  id,
  historyData
) => {
  // TODO validate patient from same hospital

  try {
    await medicalHistorySchema.validateAsync(historyData);
    const patient = await pool.query(queryFindPatientByID, [
      hospitalID,
      patientID
    ]);
    if (!patient[0][0]) throw new Error("no patient with id exists");

    const addedRecord = await pool.query(insertMedicalHistory, [
      patientID,
      historyData.userID,
      historyData.givenName,
      historyData.givenPhone,
      historyData.givenRelation,
      historyData.bloodGroup,
      historyData.bloodPressure,
      historyData.disease,
      historyData.foodAllergy,
      historyData.medicineAllergy,
      historyData.anaesthesia,
      historyData.meds,
      historyData.selfMeds,
      historyData.chestCondition,
      historyData.neurologicalDisorder,
      historyData.heartProblems,
      historyData.infections,
      historyData.mentalHealth,
      historyData.drugs,
      historyData.pregnant,
      historyData.hereditaryDisease,
      historyData.lumps,
      historyData.cancer,
      historyData.familyDisease
    ]);
    historyData.id = addedRecord[0].insertId;
    return historyData;
  } catch (err) {
    if (err.isJoi === true) throw new Error(err.message);
    throw new Error(err.message);
  }
};

module.exports = {
  getMedicalHistoryByID,
  addMedicalHistory,
  addMedicalHistory,
  getMedicalHistoryByPatientID,
  editMedicalHistoryByID
};
