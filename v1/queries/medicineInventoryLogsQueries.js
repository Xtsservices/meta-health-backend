const queryInsertInventoryLogsData = `INSERT INTO medicineInventoryLogs (hospitalID,medicinesList,manufactureID,userID) VALUES (?,?,?,?)`;
const queryGetInventoryLogs = `SELECT 
    mi.*,  -- Selects all columns from medicineInventory
    users.firstName,
    users.lastName,
    mim.agencyName,
    mim.manufacturer,
    mim.contactNo,
    mim.agentCode
FROM medicineInventory AS mi
LEFT JOIN users ON mi.addedBy = users.id
LEFT JOIN medicineInventoryManufacture AS mim ON mi.agencyID = mim.id
WHERE mi.hospitalID = ?
AND isActive = 1
order by id desc;`;

module.exports = {
  queryInsertInventoryLogsData,
  queryGetInventoryLogs
};
