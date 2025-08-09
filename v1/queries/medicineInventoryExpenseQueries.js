const queryInsertExpenseData = `INSERT INTO medicineInventoryExpense (hospitalID,medicinesList,manufactureID) VALUES (?,?,?)`;
const queryGetInventoryExpense = `SELECT medicineInventoryExpense.*, medicineInventoryManufacture.agencyName, medicineInventoryManufacture.contactNo,
medicineInventoryManufacture.location,medicineInventoryManufacture.agentCode,medicineInventoryManufacture.email,medicineInventoryManufacture.manufacturer
FROM medicineInventoryExpense
LEFT JOIN medicineInventoryManufacture on medicineInventoryExpense.manufactureID = medicineInventoryManufacture.id
WHERE medicineInventoryExpense.hospitalID = ?
order by addedOn desc;`;

module.exports = {
  queryInsertExpenseData,
  queryGetInventoryExpense
};
