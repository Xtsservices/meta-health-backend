const queryGetAllManufacture = `SELECT * FROM medicineInventoryManufacture where hospitalID = ?`;
const queryGetManufacturePresent = `SELECT * FROM medicineInventoryManufacture where hospitalID = ? and agencyName = ?`;
const queryInsertManufactureData = `INSERT INTO medicineInventoryManufacture ( hospitalID,agencyName,contactNo,email,agentCode,manufacturer) VALUES (?,?,?,?,?,?)`;

const queryGetAgencyAndManufacturePresent = `SELECT * FROM medicineInventoryManufacture where hospitalID = ? and agencyName = ? and manufacturer=?`;

module.exports = {
  queryGetAllManufacture,
  queryGetManufacturePresent,
  queryInsertManufactureData,
  queryGetAgencyAndManufacturePresent
};
