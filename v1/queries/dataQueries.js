const queryGetPostCode = `SELECT pincode from PincodeDistrict where district=?`;
const queryGetAllTest = `SELECT * from TestList`;

module.exports = {
  queryGetPostCode,
  queryGetAllTest
};
