const queryFindHub = "SELECT * FROM hubs WHERE hubAddress=?";
const queryUpdateHospitalID =
  "UPDATE hubs SET hospitalID=?,hubCustomName=? WHERE id=?";
const insertHub =
  "INSERT INTO hubs(hospitalID,hubName,hubCustomName,hubAddress,hubProtocolAddress) VALUES(?,?,?,?,?)";
const queryGetAllHubs = "SELECT * FROM hubs WHERE hospitalID=?";
const getByID = "SELECT * FROM hubs WHERE hospitalID=? AND id=?";
const queryRemoveHubFromHospital = "UPDATE hubs SET hospitalID=? WHERE id=?";
module.exports = {
  queryFindHub,
  queryUpdateHospitalID,
  insertHub,
  queryGetAllHubs,
  getByID,
  queryRemoveHubFromHospital
};
