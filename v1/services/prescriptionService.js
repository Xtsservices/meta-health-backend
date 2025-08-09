const {
  queryInsertPrescription,
  queryGetAllPrescription,
  queryPatientTimelineByID,
  queryInsertFollowUp,
  queryUpdatePreviousFollowUp,
  queryUpdatePatientTimeLine,
  queryUpdatePatientRevisit,
  queryGetFullPatientByID
} = require("../queries/prescriptionQueries");
const {
  serverError,
  missingBody,
  resourceNotFound,
  notAllowed
} = require("../utils/errors");
// const { ROLES_LIST } = require("../utils/roles");
const pool = require("../db/conn");
const patientUtils = require("../utils/patientUtils");
const {
  prescriptionSchema
} = require("../helper/validators/prescriptionValidator");

const getAllPrecription = async (hospitalID, timeLineID, patientID) => {
  try {
    const result = await pool.query(queryGetAllPrescription, [
      hospitalID,
      patientID
    ]);

    return result[0];
  } catch (err) {
    throw new Error(err.message);
  }
};

module.exports = {
  getAllPrecription
};
