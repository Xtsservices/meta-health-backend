const queryExistingSymptoms =
  "SELECT COUNT(*) as count FROM symptoms WHERE timeLineID=? AND symptom IN (?)";
const insertsymptoms =
  "INSERT INTO symptoms(timeLineID,userID,patientID,symptom,duration,durationParameter,conceptID,addedOn) VALUES ?";
const queryGetAllSymptoms = "SELECT * FROM symptoms WHERE patientID=?";
const queryGetSymptomByID =
  "SELECT * FROM symptoms WHERE timeLineID=? AND id=?";
const queryDeleteSymptomByID =
  "DELETE FROM symptoms WHERE timeLineID=? AND id=?";
const queryGetSymptomsByID = "SELECT * FROM symptoms WHERE id IN (?)";

module.exports = {
  queryExistingSymptoms,
  insertsymptoms,
  queryGetAllSymptoms,
  queryGetSymptomByID,
  queryDeleteSymptomByID,
  queryGetSymptomsByID
};
