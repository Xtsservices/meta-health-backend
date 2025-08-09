const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord
} = require("../utils/errors");
const pool = require("../db/conn");
const { schema } = require("../helper/validators/deviceValidator");
const Joi = require("joi");

const queryFindDevice = "SELECT * FROM devices WHERE deviceAddress=?";
const queryUpdateEmptyDevice =
  "UPDATE device SET deviceCustomName=? WHERE id=?";
const queryInsertEmptyDevice =
  "INSERT INTO devices(deviceName,deviceCustomName,deviceAddress) VALUES(?,?,?)";
const deviceServices = require("../services/deviceService");

/**
 * ** METHOD : POST
 * ** DESCRIPTION : add new device if not exists or update device
 * **(deviceAddress has to be unique)
 */
const addDevice = async (req, res) => {
  const hubID = req.params.hubID;
  if (!hubID) return missingBody(res, "hubID missing");
  try {
    const result = await schema.validateAsync(req.body);
    const { deviceName, deviceCustomName, deviceAddress } = result;
    const response = await deviceServices.addDevice(
      hubID,
      deviceName,
      deviceCustomName,
      deviceAddress
    );
    res.status(201).send(response);
  } catch (err) {
    if (err.isJoi === true) return missingBody(res, err.message);
    serverError(res, err.message);
  }
};

const addEmptyDevice = async (req, res) => {
  try {
    const validateData = await schema.validateAsync(req.body);
    const deviceFound = await pool.query(queryFindDevice, [deviceAddress]);
    // TODO add device name
    if (deviceFound) {
      // update device info
      deviceFound.deviceCustomName =
        validateData.deviceCustomName || deviceFound.deviceCustomName;
      await pool.query(queryUpdateEmptyDevice, [deviceFound.id]);
      res.status(200).send({
        message: "success updating device",
        device: deviceFound
      });
    }
    const result = await pool.query(queryInsertEmptyDevice, [
      validateData.deviceName,
      validateData.deviceCustomName,
      validateData.deviceAddress
    ]);
    validateData.id = result[0].insertId;
    res.status(201).send({
      message: "success adding device",
      device: validateData
    });
  } catch (err) {
    if (err.isJoi === true) return missingBody(res, err.message);
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : get all devices connected to hub
 */
const getAllDevices = async (req, res) => {
  const hubID = req.params.hubID;
  try {
    const results = await deviceServices.getAllDevices(hubID);
    res.status(200).send({
      message: "success",
      devices: results[0]
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : get device from ID
 */
const getDevice = async (req, res) => {
  const hubID = req.params.hubID;
  const id = req.params.id;
  if (!hubID) return missingBody(res, "missing hubID");
  if (!id) return missingBody(res, "missing id");
  try {
    const results = await deviceServices.getDevice(hubID, id);
    res.status(200).send({
      message: "success",
      device: results[0]
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : get all devices in hospital
 */
const getAllHospitalDevices = async (req, res) => {
  console.log("get All Devices in hospital");
  const hospitalID = req.params.hospitalID;
  try {
    const results = await deviceServices.getAllHospitalDevices(hospitalID);
    res.status(200).send({
      message: "success",
      devices: results[0]
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

module.exports = {
  addDevice,
  getAllDevices,
  getDevice,
  getAllHospitalDevices,
  addEmptyDevice
};
