const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord
} = require("../utils/errors");
const pool = require("../db/conn");
const { symptomSchema } = require("../helper/validators/symptomValidator");
const symptomServices = require("../services/symptomServices");

/**
 * *** METHOD : POST
 * *** DESCRIPTION : insert symptoms list
 */

const insertSymptomsList = async (req, res) => {
  try {
    const { timeLineID, userID, symptoms, patientID } = req.body;
    if (!symptoms || symptoms.length === 0)
      return missingBody(res, "no symptoms have been added");

    const results = await symptomServices.insertSymptomsList(
      timeLineID,
      userID,
      symptoms,
      patientID
    );

    res.status(201).send({
      message: "success",
      symptoms: results
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
 * *** DESCRIPTION : get all symptoms from patientID
 */
const getAllSymptoms = async (req, res) => {
  const patientID = req.params.patientID;
  if (!patientID) return missingBody(res, "missing patientID");
  try {
    const results = await symptomServices.getAllSymptoms(patientID);

    res.status(200).send({
      message: "success",
      symptoms: results
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * *** METHOD : GET
 * *** DESCRIPTION : get symptom from symptomID
 */
const getSymptomFromID = async (req, res) => {
  const timeLineID = req.params.timeLineID;
  const symptomID = req.params.symptomID;
  if (!timeLineID) return missingBody(res, "missing timeLineID");
  try {
    const results = await symptomServices.getSymptomFromID(
      timeLineID,
      symptomID
    );

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
const deleteSymptomFromID = async (req, res) => {
  const timeLineID = req.params.timeLineID;
  const symptomID = req.params.symptomID;
  if (!timeLineID) return missingBody(res, "missing timeLineID");

  try {
    await symptomServices.deleteSymptomFromID(timeLineID, symptomID);

    res.status(200).send({
      message: "success"
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

module.exports = {
  insertSymptomsList,
  getAllSymptoms,
  getSymptomFromID,
  deleteSymptomFromID
};
