const querychangeIsActiveStatusMedicineInventory = `UPDATE medicineInventory SET isActive=0 WHERE id=?`;
const queryGetMedicineInventory = `
SELECT 
    *,
    SUM(quantity) AS totalQuantity
FROM medicineInventory
WHERE 
  hospitalID = ? 
  AND isActive = 1
GROUP BY name, expiryDate,category;
`;
const queryInsertMedicineInventory = `INSERT INTO 
medicineInventory(hospitalID,addedBy, name, category , hsn , quantity, costPrice , sellingPrice, agencyID , expiryDate,lowStockValue,gst,addedStock) 
VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`;
const querySearchMedicineExist = `SELECT * from medicineInventory where name = ? and hospitalID = ?`;
const queryUpdateQuantity = `UPDATE medicineInventory SET quantity = ?,isReordered=0 where hospitalID = ? and name = ?`;

module.exports = {
  querychangeIsActiveStatusMedicineInventory,
  queryGetMedicineInventory,
  queryInsertMedicineInventory,
  querySearchMedicineExist,
  queryUpdateQuantity
};
