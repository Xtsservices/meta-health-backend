const { queryGetPostCode, queryGetAllTest } = require("../queries/dataQueries");
const pool = require("../db/conn");
const getPincodeDistrictData = async (district) => {
  const result = await pool.query(queryGetPostCode, [district]);
  return result;
};

const getAllTest = async () => {
  const result = await pool.query(queryGetAllTest);
  return result;
};

module.exports = {
  getPincodeDistrictData,
  getAllTest
};
