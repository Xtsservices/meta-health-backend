const pool = require("../db/conn");

const {
  queryGetAllManufacture
} = require("../queries/medicineInventoryManufactureQueries");
const getAllManufacture = async (hospitalID) => {
  try {
    let [response] = await pool.query(queryGetAllManufacture, [hospitalID]);

    if (response.length == 0) {
      return { status: 200, data: [] };
    }

    if (response.length > 0) {
      return { status: 200, data: response };
    }
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

module.exports = {
  getAllManufacture
};
