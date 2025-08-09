const pool = require("../db/conn");
const {
  queryGetAllFollowUp,
  queryActiveFollowUp
} = require("../queries/followUpQueries");

const getAllFollowUp = async (timelineID) => {
  const result = await pool.query(queryGetAllFollowUp, [timelineID]);
  return result;
};

const getAllActiveFollowUp = async (hospitalID, userID) => {
  const result = await pool.query(queryActiveFollowUp, [hospitalID, userID]);
  return result;
};

module.exports = {
  getAllFollowUp,
  getAllActiveFollowUp
};
