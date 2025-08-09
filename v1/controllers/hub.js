const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord
} = require("../utils/errors");
const pool = require("../db/conn");
const { schema } = require("../helper/validators/hubValidator");
const hubServices = require("../services/hubService");
const vitaTrackPool = require("../db/vitalTrackConn");

const queryFindHub = "SELECT * FROM hubs WHERE hubAddress=?";
const queryUpdateHospitalID =
  "UPDATE hubs SET hospitalID=?,hubCustomName=? WHERE id=?";
const insertHub =
  "INSERT INTO hubs(hospitalID,hubName,hubCustomName,hubAddress,hubProtocolAddress) VALUES(?,?,?,?,?)";
const queryGetAllHubs = "SELECT * FROM hubs WHERE hospitalID=?";
const getByID = "SELECT * FROM hubs WHERE hospitalID=? AND id=?";
const queryRemoveHubFromHospital = "UPDATE hubs SET hospitalID=? WHERE id=?";

const addHub = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  try {
    const result = await schema.validateAsync(req.body);
    const { hubName, hubCustomName, hubAddress, hubProtocolAddress } = result;
    const results = await pool.query(queryFindHub, [hubAddress]);
    if (results[0].length != 0) {
      // hub already present
      // update hospitalID to new hospitalID
      const { id } = results[0][0];
      console.log(`hospital id found : ${id}`);
      await pool.query(queryUpdateHospitalID, [hospitalID, hubCustomName, id]);
      res.status(200).send({
        message: "success updating hub",
        hub: {
          id: id,
          hubName: hubName,
          hubCustomName: hubCustomName,
          hubAddress: hubAddress,
          hubProtocolAddress: hubProtocolAddress
        }
      });
      return;
    }
    const response = await pool.query(insertHub, [
      hospitalID,
      hubName,
      hubCustomName,
      hubAddress,
      hubProtocolAddress
    ]);
    res.status(201).send({
      message: "success adding hub",
      hub: {
        id: response[0].insertId,
        hubName: hubName,
        hubCustomName: hubCustomName,
        hubAddress: hubAddress,
        hubProtocolAddress: hubProtocolAddress
      }
    });
  } catch (err) {
    if (err.isJoi === true) return missingBody(res, err.message);
    serverError(res, err.message);
  }
};

const getAllHubs = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  let connection;
  try {
    if (!hospitalID || isNaN(hospitalID)) {
      return res.status(400).json({ message: 'Invalid hospitalID' });
    }

    // Get connection to VitaTrack DB
    connection = await vitaTrackPool.getConnection();

    // Query users with the given hospitalID
    const getUsersQuery = 'SELECT id FROM users WHERE hospitalID = ? AND active = 1';
    const [user] = await connection.query(getUsersQuery, [hospitalID]);
    if (user.length === 0) {
      return res.status(200).json({
        message: 'success',
        hubs: [],
      });
    }
    const userId = user[0].id;
    const getHubsQuery = 'SELECT * FROM hubs WHERE userId = ? AND active = 1';
    const [hubs] = await connection.query(getHubsQuery, [userId]);
    // const results = await hubServices.getAllHubs(hospitalID);

    res.status(200).send({
      message: "success",
      hubs
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getHub = async (req, res) => {
  console.log("amtriggered=======123==================");
  const hospitalID = req.params.hospitalID;
  const id = req.params.id;
  if (!id) return missingBody(res, "missing id");
  try {
    const results = await pool.query(getByID, [hospitalID, id]);
    console.log("results===================", results);

    if (results[0].length == 0) return resourceNotFound(res, "No HUB Found");
    res.status(200).send({
      message: "success",
      hub: results[0][0]
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * *** METHOD : PATCH
 * *** DESCRIPTION : REMOVE HUB FROM HOSPITAL
 */
const removeHubFromHospital = async (req, res) => {
  const hubID = req.params.id;
  try {
    const [result] = await pool.query(queryRemoveHubFromHospital, [
      null,
      hubID
    ]);
    // console.log(`result: ${result}`)
    if (!result.changedRows) return serverError(res, "failed to update");
    res.status(200).send({
      message: "success"
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

module.exports = { addHub, getAllHubs, getHub, removeHubFromHospital };
