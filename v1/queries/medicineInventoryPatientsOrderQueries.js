const queryInsertMedicineInventoryPatientOrder = `
INSERT INTO 
medicineInventoryPatientsOrder 
(hospitalID,patientTimeLineID,patientID,location,departmemtType,doctorID,medicinesList,notes,status) 
VALUES (?,?,?,?,?,?,?,?,?)`;

const queryGetMedicineInventoryPatientOrderIfExist = `SELECT * from medicineInventoryPatientsOrder where hospitalID = ? and patientID = ?`;

const queryCheckGetPatientTimeLine = `
SELECT * FROM patientTimeLine 
WHERE patientID = ?`;

const queryGetMedicineInventoryPatientOrder = `
SELECT 
    medicineInventoryPatientsOrder.id,
    medicineInventoryPatientsOrder.hospitalID,
    users.firstName,
    users.lastName,
    medicineInventoryPatientsOrder.medicinesList,
    medicineInventoryPatientsOrder.status,
    medicineInventoryPatientsOrder.paymentDetails,
    medicineInventoryPatientsOrder.notes,
    medicineInventoryPatientsOrder.addedOn,
    medicineInventoryPatientsOrder.departmemtType,
    medicineInventoryPatientsOrder.rejectReason,
    medicineInventoryPatientsOrder.totalAmount, 
    medicineInventoryPatientsOrder.paidAmount, medicineInventoryPatientsOrder.dueAmount,
    patients.pName,
    medicineInventoryPatientsOrder.patientTimeLineID,
    patients.id AS patientID,
    departments.name AS location 
FROM 
    medicineInventoryPatientsOrder
LEFT JOIN 
    patientTimeLine ON medicineInventoryPatientsOrder.patientTimeLineID = patientTimeLine.id 
LEFT JOIN 
    patients ON patientTimeLine.patientID = patients.id
LEFT JOIN 
    departments ON medicineInventoryPatientsOrder.location = departments.id
LEFT JOIN 
    users ON medicineInventoryPatientsOrder.doctorID = users.id
WHERE 
    medicineInventoryPatientsOrder.hospitalID = ?
    AND JSON_CONTAINS(medicineInventoryPatientsOrder.medicinesList, '{"status": "pending"}', '$')
ORDER BY 
    addedOn DESC;
`;

const queryGetMedicineInventoryPatientTimeLineID = `
SELECT * FROM medicineInventoryPatientsOrder
where hospitalID = ? and patientTimeLineID = ?`;

const queryUpdatePatientOrder = `UPDATE medicineInventoryPatientsOrder SET status = ? where hospitalID = ? and patientTimeLineID = ?`;

const queryGetDepartmentConsumption = `SELECT departmemtType, paymentDetails FROM medicineInventoryPatientsOrder  WHERE hospitalID = ? AND paymentDetails IS NOT NULL AND departmemtType IS NOT NULL;
`;

const queryGetMedicineInfoUsedPrice = `SELECT 
  
(h.soldQty * m.sellingPrice) AS usedPrice
FROM 
medicineStockHistory h
LEFT JOIN 
medicineInventory m 
ON 
h.medicineInventoryID = m.id
WHERE 
h.hospitalID = ?
AND DATE(h.soldDate) BETWEEN ? AND ?
`;

const queryGetMedicineInfoinStockPrice = `
 SELECT 
    SUM((m.addedStock * m.sellingPrice) - IFNULL((
        SELECT SUM(msh.soldQty * m.sellingPrice)
        FROM medicineStockHistory msh
        WHERE msh.medicineInventoryID = m.id
          AND msh.hospitalID = m.hospitalID
           AND DATE(msh.soldDate) BETWEEN ? AND ?
    ), 0)) AS inStockPrice
FROM 
    medicineInventory m
WHERE 
    m.hospitalID = ?
    AND DATE(m.expiryDate) > ?
    AND DATE(m.addedOn) <= ?
    AND (m.deletedOn IS NULL OR m.deletedOn > ?);
`;

const queryGetMedicineInfoexpiryPrice = `
SELECT 
    SUM(m.quantity * m.sellingPrice) AS expiryPrice 
FROM 
    medicineInventory m
WHERE 
    m.hospitalID = ?
    AND DATE(m.expiryDate) <= ?; 
`;

const queryGetExpiryProductInfo = `
SELECT 
    *,
    SUM(quantity) AS totalQuantity,
    MIN(expiryDate) AS earliestExpiry
FROM medicineInventory
WHERE 
 expiryDate < CURRENT_TIMESTAMP 
  AND hospitalID = ?
  AND isReordered = 0
  AND isActive = 1
GROUP BY name, category
`;

const queryGetLowStockProductInfo = `
SELECT 
    *,
    SUM(quantity) AS totalQuantity,
    MIN(expiryDate) AS earliestExpiry
FROM medicineInventory
WHERE quantity < lowStockValue
  AND expiryDate > CURRENT_TIMESTAMP 
  AND hospitalID = ?
  AND isReordered = 0
  AND isActive = 1
GROUP BY name, category;
`;
const queryGetMedicineInventoryPatientsOrderCompletedWithoutRegWithDate = `SELECT medicineInventoryPatientsOrder.id,medicineInventoryPatientsOrder.hospitalID,medicineInventoryPatientsOrder.medicinesList,medicineInventoryPatientsOrder.status,medicineInventoryPatientsOrder.paymentDetails, medicineInventoryPatientsOrder.updatedOn,
medicineInventoryPatientsOrder.notes,medicineInventoryPatientsOrder.addedOn,medicineInventoryPatientsOrder.pIdNew, medicineInventoryPatients.medGivenBy,
medicineInventoryPatients.pName,medicineInventoryPatients.phoneNumber, medicineInventoryPatients.fileName FROM medicineInventoryPatientsOrder
LEFT JOIN medicineInventoryPatients ON medicineInventoryPatientsOrder.pIdNew = medicineInventoryPatients.id 
where medicineInventoryPatientsOrder.hospitalID = ? and medicineInventoryPatientsOrder.status = "completed" 
and medicineInventoryPatientsOrder.pIDNew IS NOT NULL 
AND DATE(medicineInventoryPatientsOrder.updatedOn) BETWEEN ? AND ?
order by addedOn desc`;

const queryGetMedicineInventoryPatientsOrderCompletedWithoutReg = `SELECT medicineInventoryPatientsOrder.id,medicineInventoryPatientsOrder.hospitalID,medicineInventoryPatientsOrder.medicinesList,medicineInventoryPatientsOrder.status,medicineInventoryPatientsOrder.paymentDetails,medicineInventoryPatientsOrder.updatedOn,
medicineInventoryPatientsOrder.notes,medicineInventoryPatientsOrder.addedOn,medicineInventoryPatientsOrder.pIdNew, medicineInventoryPatients.medGivenBy,
medicineInventoryPatients.pName,medicineInventoryPatients.phoneNumber, medicineInventoryPatients.fileName FROM medicineInventoryPatientsOrder
LEFT JOIN medicineInventoryPatients ON medicineInventoryPatientsOrder.pIdNew = medicineInventoryPatients.id 
where medicineInventoryPatientsOrder.hospitalID = ? and medicineInventoryPatientsOrder.status = "completed" and medicineInventoryPatientsOrder.pIDNew IS NOT NULL order by addedOn desc`;

const queryGetMedicineInventoryPatientsOrderCompletedWithRegPatientWithDate = (
  numParams
) => `SELECT medicineInventoryPatientsOrder.id,medicineInventoryPatientsOrder.hospitalID,users.firstName,users.lastName,
medicineInventoryPatientsOrder.medicinesList,medicineInventoryPatientsOrder.status,medicineInventoryPatientsOrder.paymentDetails,
medicineInventoryPatientsOrder.notes,medicineInventoryPatientsOrder.addedOn,medicineInventoryPatientsOrder.departmemtType,
medicineInventoryPatientsOrder.totalAmount, medicineInventoryPatientsOrder.paidAmount, 
patients.pName,medicineInventoryPatientsOrder.patientTimeLineID, patients.id as patientID, departments.name as location, medicineInventoryPatientsOrder.updatedOn FROM medicineInventoryPatientsOrder
LEFT JOIN patientTimeLine ON medicineInventoryPatientsOrder.patientTimeLineID = patientTimeLine.id 
LEFT JOIN patients ON patientTimeLine.patientID = patients.id
LEFT JOIN departments on medicineInventoryPatientsOrder.location = departments.id
LEFT JOIN users on medicineInventoryPatientsOrder.doctorID = users.id
where medicineInventoryPatientsOrder.hospitalID = ?  and medicineInventoryPatientsOrder.doctorID IS NOT NULL
AND medicineInventoryPatientsOrder.departmemtType IN (${new Array(numParams)
  .fill("?")
  .join(", ")})
AND DATE(medicineInventoryPatientsOrder.updatedOn) BETWEEN ? AND ? 
order by addedOn desc;`;

const queryGetMedicineInventoryPatientsOrderCompletedWithRegPatient = (
  numParams
) => `SELECT medicineInventoryPatientsOrder.id,medicineInventoryPatientsOrder.hospitalID,users.firstName,users.lastName,
medicineInventoryPatientsOrder.medicinesList,medicineInventoryPatientsOrder.status,medicineInventoryPatientsOrder.paymentDetails,
medicineInventoryPatientsOrder.notes,medicineInventoryPatientsOrder.addedOn,medicineInventoryPatientsOrder.departmemtType,
medicineInventoryPatientsOrder.totalAmount, medicineInventoryPatientsOrder.paidAmount, 
patients.pName,medicineInventoryPatientsOrder.patientTimeLineID, patients.id as patientID, departments.name as location, medicineInventoryPatientsOrder.updatedOn FROM medicineInventoryPatientsOrder
LEFT JOIN patientTimeLine ON medicineInventoryPatientsOrder.patientTimeLineID = patientTimeLine.id 
LEFT JOIN patients ON patientTimeLine.patientID = patients.id
LEFT JOIN departments on medicineInventoryPatientsOrder.location = departments.id
LEFT JOIN users on medicineInventoryPatientsOrder.doctorID = users.id
where medicineInventoryPatientsOrder.hospitalID = ?  and medicineInventoryPatientsOrder.doctorID IS NOT NULL
AND medicineInventoryPatientsOrder.departmemtType IN (${new Array(numParams)
  .fill("?")
  .join(", ")})
order by addedOn desc;`;

const querygetRejectedData = `SELECT 
medicineInventoryPatientsOrder.id,
medicineInventoryPatientsOrder.hospitalID,
users.firstName,
users.lastName,
medicineInventoryPatientsOrder.medicinesList,
medicineInventoryPatientsOrder.status,
medicineInventoryPatientsOrder.paymentDetails,
medicineInventoryPatientsOrder.notes,
medicineInventoryPatientsOrder.addedOn,
medicineInventoryPatientsOrder.departmemtType,
medicineInventoryPatientsOrder.rejectReason,
medicineInventoryPatientsOrder.totalAmount, 
medicineInventoryPatientsOrder.paidAmount, medicineInventoryPatientsOrder.dueAmount,
patients.pName,
medicineInventoryPatientsOrder.patientTimeLineID,
patients.id AS patientID,
departments.name AS location 
FROM 
medicineInventoryPatientsOrder
LEFT JOIN 
patientTimeLine ON medicineInventoryPatientsOrder.patientTimeLineID = patientTimeLine.id 
LEFT JOIN 
patients ON patientTimeLine.patientID = patients.id
LEFT JOIN 
departments ON medicineInventoryPatientsOrder.location = departments.id
LEFT JOIN 
users ON medicineInventoryPatientsOrder.doctorID = users.id
WHERE 
medicineInventoryPatientsOrder.hospitalID = ?
AND    medicineInventoryPatientsOrder.departmemtType = 1

ORDER BY 
addedOn DESC;
`;

module.exports = {
  queryInsertMedicineInventoryPatientOrder,
  queryGetMedicineInventoryPatientOrderIfExist,
  queryCheckGetPatientTimeLine,
  queryGetMedicineInventoryPatientOrder,
  queryUpdatePatientOrder,
  queryGetDepartmentConsumption,
  queryGetMedicineInfoUsedPrice,
  queryGetMedicineInfoinStockPrice,
  queryGetMedicineInfoexpiryPrice,
  queryGetMedicineInventoryPatientTimeLineID,
  queryGetExpiryProductInfo,
  queryGetLowStockProductInfo,
  queryGetMedicineInventoryPatientsOrderCompletedWithoutReg,
  queryGetMedicineInventoryPatientsOrderCompletedWithRegPatient,
  queryGetMedicineInventoryPatientsOrderCompletedWithRegPatientWithDate,
  queryGetMedicineInventoryPatientsOrderCompletedWithoutRegWithDate,
  querygetRejectedData
};
