const {
  queryGetVitalAlerts,
  queryGetHospitalAlerts,
  queryUpdateSeenStatus,
  queryGetAlertsCount
} = require("../queries/alertsQueries");

const pool = require("../db/conn");

const getVitalAlerts = async (timeLineID) => {
  const [results] = await pool.query(queryGetVitalAlerts, [timeLineID]);
  return results;
};

const getHospitalAlerts = async (hospitalID) => {
  const [results] = await pool.query(queryGetHospitalAlerts, [hospitalID]);
  return results;
};

const updateSeenStatus = async (id) => {
  const [results] = await pool.query(queryUpdateSeenStatus, [1, id]);
  return results;
};

const getAlertCount = async (hospitalID) => {
  const [results] = await pool.query(queryGetAlertsCount, [hospitalID, 0]);
  return results;
};

module.exports = {
  getVitalAlerts,
  getHospitalAlerts,
  updateSeenStatus,
  getAlertCount
};
