const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord
} = require("../utils/errors");

const medicalHistoryService = require("../services/medicalHistoryService");

/**
 * ** METHOD : POST
 * ** DESCRIPTION : ADD PATIENT MEDICAL HISTORY
 */
const addMedicalHistory = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const patientID = req.params.patientID;
  const historyData = {
    patientID,
    userID: req.body.userID,
    givenName: req.body.givenName,
    givenPhone: req.body.givenPhone,
    givenRelation: req.body.givenRelation,
    bloodGroup: req.body.bloodGroup,
    bloodPressure: req.body.bloodPressure,
    disease: req.body.disease,
    foodAllergy: req.body.foodAllergy,
    medicineAllergy: req.body.medicineAllergy,
    anaesthesia: req.body.anaesthesia,
    meds: req.body.meds,
    selfMeds: req.body.selfMeds,
    chestCondition: req.body.chestCondition,
    neurologicalDisorder: req.body.neurologicalDisorder,
    heartProblems: req.body.heartProblems,
    infections: req.body.infections,
    mentalHealth: req.body.mentalHealth,
    drugs: req.body.drugs,
    pregnant: req.body.pregnant,
    hereditaryDisease: req.body.hereditaryDisease,
    lumps: req.body.lumps,
    cancer: req.body.cancer
  };

  try {
    const result = await medicalHistoryService.addMedicalHistory(
      hospitalID,
      patientID,
      historyData
    );

    res.status(201).send({
      message: "success",
      history: result
    });
  } catch (err) {
    if (err.isJoi === true) return missingBody(res, err.message);
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : PATCH
 * ** DESCRIPTION : EDIT PATIENT MEDICAL HISTORY
 */
const editMedicalHistoryByID = async (req, res) => {
  // TODO validate patient from same hospital
  const hospitalID = req.params.hospitalID;
  const patientID = req.params.patientID;
  const id = req.params.id;
  const historyData = {
    patientID,
    userID: req.body.userID,
    givenName: req.body.givenName,
    givenPhone: req.body.givenPhone,
    givenRelation: req.body.givenRelation,
    bloodGroup: req.body.bloodGroup,
    bloodPressure: req.body.bloodPressure,
    disease: req.body.disease,
    foodAllergy: req.body.foodAllergy,
    medicineAllergy: req.body.medicineAllergy,
    anaesthesia: req.body.anaesthesia,
    meds: req.body.meds,
    selfMeds: req.body.selfMeds,
    chestCondition: req.body.chestCondition,
    neurologicalDisorder: req.body.neurologicalDisorder,
    heartProblems: req.body.heartProblems,
    infections: req.body.infections,
    mentalHealth: req.body.mentalHealth,
    drugs: req.body.drugs,
    pregnant: req.body.pregnant,
    hereditaryDisease: req.body.hereditaryDisease,
    lumps: req.body.lumps,
    cancer: req.body.cancer,
    familyDisease: req.body.familyDisease
  };

  try {
    const result = await medicalHistoryService.editMedicalHistoryByID(
      hospitalID,
      patientID,
      id,
      historyData
    );

    res.status(201).send({
      message: "success",
      history: result
    });
  } catch (err) {
    if (err.isJoi === true) return missingBody(res, err.message);
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : get Medical History of patient from patient ID
 */
const getMedicalHistoryByPatientID = async (req, res) => {
  const patientID = req.params.patientID;
  try {
    const results = await medicalHistoryService.getMedicalHistoryByPatientID(
      patientID
    );

    res.status(200).send({
      message: "success",
      medicalHistory: results
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : get Medical History of patient from patient ID
 */
const getMedicalHistoryByID = async (req, res) => {
  const id = req.params.id;
  try {
    const results = await medicalHistoryService.getMedicalHistoryByID(id);

    res.status(200).send({
      message: "success",
      medicalHistory: results
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

module.exports = {
  addMedicalHistory,
  getMedicalHistoryByPatientID,
  getMedicalHistoryByID,
  editMedicalHistoryByID
};
