const queryGetLatestTimeLine =
  "SELECT * FROM patientTimeLine WHERE patientID=? ORDER BY startTime DESC LIMIT 1";
const queryGetLatestPatientTimeLine =
  "SELECT * FROM patientTimeLine WHERE id=? AND hospitalID=?";

const queryGetAllTimeLines = `SELECT * FROM patientTimeLine WHERE patientID=? ORDER BY startTime ASC`;
const queryGetAllPatientTimeLine = `SELECT * FROM patientTimeLine WHERE patientID=? ORDER BY startTime ASC`;

module.exports = {
  queryGetLatestTimeLine,
  queryGetAllTimeLines,
  queryGetAllPatientTimeLine,
  queryGetLatestPatientTimeLine
};
