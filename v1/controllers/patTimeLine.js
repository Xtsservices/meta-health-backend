const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord
} = require("../utils/errors");
const patientTimeLineServices = require("../services/patientTimeLineServices");

/**
 *** METHOD : GET
 *** DESCRIPTION : get patient by id and join the latest timeline
 ***
 */
const getLatestTimeLineByPatientID = async (req, res) => {
  console.log("get patient by id");
  const patientID = req.params.patientID;
  try {
    const results = await patientTimeLineServices.getLatestTimeLineByPatientID(
      patientID
    );

    // console.log(`result : ${JSON.stringify(results)}`)
    if (!results) return resourceNotFound(res, "no timeline found");

    res.status(200).send({
      message: "success",
      patientTimeLine: results
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getLatestTimeLineByPatienTimelinetID = async (req, res) => {
  const id = req.params.id;
  const hospitalID = req.params.hospitalID;
  try {
    const results =
      await patientTimeLineServices.getLatestTimeLineByPatienTimelinetID(
        id,
        hospitalID
      );

    // console.log(`result : ${JSON.stringify(results)}`)
    if (!results) return resourceNotFound(res, "no timeline found");

    res.status(200).send({
      message: "success",
      patientTimeLine: results
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * **
 * ** METHOD : GET
 * ** DESCRIPTION : GET ALL PATIENT TIMELINES
 */

const getAllTimeLineOfPatient = async (req, res) => {
  const patientID = req.params.patientID;
  try {
    const results = await patientTimeLineServices.getAllTimeLineOfPatient(
      patientID
    );

    res.status(200).send({
      message: "success",
      patientTimeLines: results
    });
  } catch (error) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET ALL HISTORY FROM TIMELINES
 */
const getAllDataInTimeLine = async (req, res) => {
  // const hospitalID = req.params.hospitalID;
  const id = req.params.patientID;
  try {
  } catch (err) {}
};

const getAllTimeLines = async (req, res) => {
  const patientID = req.params.id;

  try {
    const result = await patientTimeLineServices.getAllTimeLines(patientID);

    res.status(200).send({
      message: "success",
      timelines: result
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

module.exports = {
  getLatestTimeLineByPatientID,
  getAllTimeLines,
  getAllTimeLineOfPatient,
  getLatestTimeLineByPatienTimelinetID
};
