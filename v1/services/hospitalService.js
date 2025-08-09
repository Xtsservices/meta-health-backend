const {
  queryCountHospitals,
  queryCountUsers,
  queryCountPatients
} = require("../queries/hospitalQueries");

const pool = require("../db/conn");

const getCount = async () => {
  const [result] = await pool.query(
    `${queryCountHospitals} UNION ${queryCountUsers} UNION ${queryCountPatients}`
  );
  return result;
};

module.exports = {
  getCount
};
