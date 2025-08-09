const pool = require("../db/conn");
const { queryGetPocus, queryInsertPocus } = require("../queries/pocusQueries");

async function addPocusService(timeLineID, data) {
  try {
    const values = [
      data.abdomen || "",
      data.abg || "",
      data.cxr || "",
      data.ecg || "",
      data.heart || "",
      data.ivc || "",
      data.leftPleuralEffusion || "",
      data.leftPneumothorax || "",
      data.rightPleuralEffusion || "",
      data.rightPneumothorax || "",
      parseInt(timeLineID, 10),
      data.userID
    ];

    values.forEach((value, index) => {
      if (value === undefined || value === null) {
        console.error(`Value at index ${index} is undefined or null:`, value);
      }
    });

    const [result] = await pool.query(queryInsertPocus, values);
    return result;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getPocus(timeLineID) {
  try {
    const results = await pool.query(queryGetPocus, [timeLineID]);
    return results;
  } catch (err) {
    throw new Error(err.message);
  }
}

module.exports = {
  addPocusService,
  getPocus
};
