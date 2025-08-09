const queryFindDevice = "SELECT * FROM devices WHERE deviceAddress=?";
const queryUpdateDeviceID =
  "UPDATE devices SET hubID=?,deviceCustomName=? WHERE id=?";
const queryUpdateEmptyDevice =
  "UPDATE device SET deviceCustomName=? WHERE id=?";
const queryInsertEmptyDevice =
  "INSERT INTO devices(deviceName,deviceCustomName,deviceAddress) VALUES(?,?,?)";
const insertDevice =
  "INSERT INTO devices(hubID,deviceName,deviceCustomName,deviceAddress) VALUES(?,?,?,?)";
const queryGetAllDevices = `SELECT devices.id,hubID,deviceName,deviceCustomName,hubs.hubName,
    deviceAddress,devices.addedOn,devices.lastModified 
    FROM hubs 
    LEFT JOIN devices ON hubs.id=devices.hubID 
    WHERE hubs.id=?`;
const getByID = "SELECT * FROM devices WHERE hubID=? AND id=?";
const queryGetAllHospitalDevices = `SELECT devices.id,hubID,deviceName,deviceCustomName,hubs.hubName,
deviceAddress,devices.addedOn,devices.lastModified 
    FROM hubs 
    LEFT JOIN devices ON hubs.id=devices.hubID 
    WHERE hospitalID=?`;
const queryUpdatePatientWithDevice = `UPDATE patients SET deviceID=? WHERE deviceID=?`;

module.exports = {
  queryFindDevice,
  queryUpdateDeviceID,
  queryUpdateEmptyDevice,
  queryInsertEmptyDevice,
  insertDevice,
  queryGetAllDevices,
  getByID,
  queryGetAllHospitalDevices,
  queryUpdatePatientWithDevice
};
