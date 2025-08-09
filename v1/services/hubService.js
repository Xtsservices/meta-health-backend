const pool = require("../db/conn");
const { schema } = require("../helper/validators/hubValidator");

const {
  queryFindHub,
  queryUpdateHospitalID,
  insertHub,
  queryGetAllHubs,
  getByID,
  queryRemoveHubFromHospital
} = require("../queries/hubQueries");

const getAllHubs = async (hospitalID) => {
  try {
    const results = await pool.query(queryGetAllHubs, [hospitalID]);

    return results[0];
  } catch (err) {
    throw new Error(err.message);
  }
};

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

module.exports = {
  getAllHubs,
  addHub
};
