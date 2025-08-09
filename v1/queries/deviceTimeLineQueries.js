const getPatientByID = `SELECT * FROM patients WHERE hospitalID=? AND id=?`;
const queryAddDeviceTimeLine =
  "INSERT INTO deviceTimeLines (patientID,deviceID,addUserID) VALUES(?,?,?)";
const getLatestDeviceTimeLine =
  "SELECT * FROM deviceTimeLines WHERE patientID=? ORDER BY startTime DESC LIMIT 1";
const queryUpdateDeviceTimeLine =
  "UPDATE deviceTimeLines SET removeUserID=? WHERE id=?";
const queryUpdatePatientWithDevice =
  "UPDATE patients SET deviceID=? WHERE id=?";
const queryDeleteDeviceTimeLIne = "DELETE deviceTimeLines WHERE id=?";
const queryRemovePatientFromDevice =
  "UPDATE patients SET deviceID=NULL WHERE id=?";

module.exports = {
  getPatientByID,
  queryAddDeviceTimeLine,
  getLatestDeviceTimeLine,
  queryUpdateDeviceTimeLine,
  queryUpdatePatientWithDevice,
  queryDeleteDeviceTimeLIne,
  queryRemovePatientFromDevice
};
