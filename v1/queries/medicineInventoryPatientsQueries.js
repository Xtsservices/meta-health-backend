const queryCheckIfpatientExistWithMobileNumber = `SELECT * FROM medicineInventoryPatients Where hospitalID = ? and phoneNumber = ? and pName = ?`;
const queryInsertPatientPharmacy = `INSERT INTO medicineInventoryPatients (hospitalID , pID, pName, phoneNumber, city,fileName, medicinesList, paymentDetails, medGivenBy) VALUES (?,?,?,?,?,?,?,?,?)`;
const queryInsertMedicineInventoryPatientWithout = `
INSERT INTO 
  medicineInventoryPatientsOrder 
  (hospitalID, medicinesList, status, paymentDetails, discount, pIdNew)
VALUES 
  (?, ?, ?, ?, ?, ?)`;

module.exports = {
  queryCheckIfpatientExistWithMobileNumber,
  queryInsertPatientPharmacy,
  queryInsertMedicineInventoryPatientWithout
};
