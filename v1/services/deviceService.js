const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord
} = require("../utils/errors");
const pool = require("../db/conn");
const {
  queryFindDevice,
  queryUpdateDeviceID,
  queryUpdateEmptyDevice,
  queryInsertEmptyDevice,
  insertDevice,
  queryGetAllDevices,
  getByID,
  queryGetAllHospitalDevices,
  queryUpdatePatientWithDevice
} = require("../queries/deviceQueries");
const vitaTrackPool = require("../db/vitalTrackConn");

/**
 * ** METHOD : POST
 * ** DESCRIPTION : add new device if not exists or update device
 * **(deviceAddress has to be unique)
 */
const addDevice = async (
  hubID,
  deviceName,
  deviceCustomName,
  deviceAddress
) => {
  const results = await pool.query(queryFindDevice, [deviceAddress]);
  if (results[0].length != 0) {
    // device already present
    // update hubID to new hubID
    const { id } = results[0][0];
    const cName = results[0][0].deviceCustomName;
    // remove if device already attached to patient
    await pool.query(queryUpdatePatientWithDevice, [null, id]);
    const cusName = deviceCustomName || cName;
    await pool.query(queryUpdateDeviceID, [hubID, cusName, id]);
    return {
      message: "success updating device",
      device: {
        id: id,
        hubID: hubID,
        deviceName: deviceName,
        deviceCustomName: deviceCustomName,
        deviceAddress: deviceAddress
      }
    };
  }
  const response = await pool.query(insertDevice, [
    hubID,
    deviceName,
    deviceCustomName,
    deviceAddress
  ]);
  return {
    message: "success adding device",
    device: {
      id: response[0].insertId,
      hubID: hubID,
      deviceName: deviceName,
      deviceCustomName: deviceCustomName,
      deviceAddress: deviceAddress
    }
  };
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
const getAllDevices = async (hubID) => {
  let connection;
  try {
    const queryGetAllDevices = `
  SELECT id, macId, code, addedOn, userId, active, hubID, invoiceNumber, purchaseDate
  FROM devices
  WHERE hubID = ? AND active = 1
`;
    connection = await vitaTrackPool.getConnection();
    const [results] = await connection.query(queryGetAllDevices, [hubID]);
    return [results];
  } catch (err) {
    console.error('Error fetching devices:', err);
    throw err;
  } finally {
    if (connection) connection.release();
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : get device from ID
 */
const getDevice = async (hubID, id) => {
  const results = await pool.query(getByID, [hubID, id]);
  if (results[0].length === 0) return resourceNotFound(res, "No DEVICE Found");
  return results;
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : get all devices in hospital
 */
const getAllHospitalDevices2 = async (hospitalID) => {
  const results = await pool.query(queryGetAllHospitalDevices, [hospitalID]);
  return results;
};

const getAllHospitalDevices = async (hospitalID) => {
  let connection;
  try {
    connection = await vitaTrackPool.getConnection();

    // Query to get devices for users in the given hospital
    const query = `
      SELECT d.id, d.macId, d.code, d.addedOn, d.userId, d.active, d.hubID, 
             d.invoiceNumber, d.purchaseDate
      FROM devices d
      JOIN users u ON d.userId = u.id
      WHERE u.hospitalID = ? AND d.active = 1
    `;
    const [devices] = await connection.query(query, [hospitalID]);

    return [devices];
  } catch (err) {
    console.error('Error fetching hospital devices:', err);
    throw err;
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  addDevice,
  getAllDevices,
  getDevice,
  getAllHospitalDevices,
  addEmptyDevice
};
