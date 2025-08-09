const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord,
  notAllowed
} = require("../utils/errors");
const pool = require("../db/conn");
const patientChecks = require("../helper/checks/patientChecks");
const patientUtils = require("../utils/patientUtils");

const {
  deviceTimeLinesSchema,
  updateDeviceTimeLinesSchema
} = require("../helper/validators/deviceTimeLineValidator");

// QUERIES
const getPatientByID = `SELECT * FROM patients WHERE hospitalID=? AND id=?`;
const queryAddDeviceTimeLine =
  "INSERT INTO deviceTimeLines (patientID,deviceID,addUserID) VALUES(?,?,?)";
const getLatestDeviceTimeLine =
  "SELECT * FROM deviceTimeLines WHERE patientID=? ORDER BY startTime DESC LIMIT 1";
const queryUpdateDeviceTimeLine =
  "UPDATE deviceTimeLines SET removeUserID=? WHERE id=?";
const queryUpdatePatientWithDevice =
  "UPDATE patients SET deviceID=? WHERE id=?";
const queryDeleteDeviceTimeLIne = "DELETE deviceTimeLines WHERE id=?";
const queryRemovePatientFromDevice =
  "UPDATE patients SET deviceID=NULL WHERE id=?";

const addDeviceToPatient = async (req, res) => {
  let connection;
  const hospitalID = req.params.hospitalID;
  try {
    const validatedData = await deviceTimeLinesSchema.validateAsync(req.body);
    const result = await pool.query(getPatientByID, [
      hospitalID,
      validatedData.patientID
    ]);
    const foundPatient = result[0][0];
    // check patient present
    if (!foundPatient) return resourceNotFound(res, "No patient exists");
    // check device already present on patient
    if (foundPatient.deviceID) return notAllowed(res, "Device already present");
    // check patient accepting device
    if (
      !patientChecks.checkPatientType(foundPatient.ptype, [
        patientUtils.patientStatus.inpatient,
        patientUtils.patientStatus.emergency
      ])
    )
      return notAllowed(res, "patient status not accepting device");
    // TODO CHECK DEVICE IS FROM THIS HOSPITAL ONLY
    connection = await pool.getConnection();
    await connection.beginTransaction();
    await connection.query(queryUpdatePatientWithDevice, [
      validatedData.deviceID,
      validatedData.patientID
    ]);
    // const {checkedRows} = update[0]
    // console.log(`checkedRow : ${JSON.stringify(checkedRows)}}`)
    // if(!checkedRows) throw new Error("failed to update patient")
    const add = await connection.query(queryAddDeviceTimeLine, [
      validatedData.patientID,
      validatedData.deviceID,
      validatedData.addUserID
    ]);
    await connection.commit();
    validatedData.id = add[0].insertId;
    res.status(200).send({
      message: "success",
      deviceTimeLine: validatedData
    });
  } catch (err) {
    if (err.isJoi === true) {
      return missingBody(res, err.message);
    }
    if (connection) {
      connection.rollback();
    }
    serverError(res, err.message);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * *** METHOD : DELETE
 * *** DESCRIPTION : delete device timeline from patient when device fails to get connected
 */

const deleteDeviceTimeLine = async (req, res) => {
  let connection;
  const id = req.params.id;
  const patientID = req.params.patientID;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    await connection.query(queryDeleteDeviceTimeLIne, [id]);
    await connection.query(queryUpdatePatientWithDevice, [NULL, patientID]);
    await connection.commit();
    res.status(200).send({
      message: "success"
    });
  } catch (err) {
    if (err.isJoi === true) {
      return missingBody(res, err.message);
    }
    if (connection) {
      connection.rollback();
    }
    serverError(res, err.message);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * *** METHOD : UPDATE
 * *** DESCRIPTION : delete device timeline from patient when device fails to get connected
 */
const removeDeviceFromPatient = async (req, res) => {
  let connection;
  const hospitalID = req.params.hospitalID;
  try {
    const validatedData = await updateDeviceTimeLinesSchema.validateAsync(
      req.body
    );
    const resultPatient = await pool.query(getPatientByID, [
      hospitalID,
      validatedData.patientID
    ]);
    const foundPatient = resultPatient[0][0];
    console.log(`foundP : ${JSON.stringify(foundPatient)}`);
    // check patient present
    if (!foundPatient) return missingBody("No patient exists");
    const result = await pool.query(getLatestDeviceTimeLine, [
      validatedData.patientID
    ]);
    if (!result[0][0]) return missingBody("No device Timeline found");
    const id = result[0][0].id;
    connection = await pool.getConnection();
    await connection.beginTransaction();
    await connection.query(queryUpdateDeviceTimeLine, [
      validatedData.removeUserID,
      id
    ]);
    await connection.query(queryRemovePatientFromDevice, [
      validatedData.patientID
    ]);
    await connection.commit();
    res.status(200).send({
      message: "success"
    });
  } catch (err) {
    if (err.isJoi === true) {
      return missingBody(res, err.message);
    }
    if (connection) {
      console.log("connection rollback");
      connection.rollback();
    }
    serverError(res, err.message);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = { addDeviceToPatient, removeDeviceFromPatient };
