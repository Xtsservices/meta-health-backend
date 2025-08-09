const queryChecktimeLineIdExist = `SELECT * FROM operationTheatre WHERE patientTimeLineID = ?`;
const queryInsertNewRowOt = `INSERT INTO operationTheatre ( patientTimeLineID, hospitalID , patientType , surgeryType) VALUES (?,?,?,?)`;
const queryGetQueryStatus = `
 SELECT ot.* , p.pName, p.id as patientID
 FROM operationTheatre ot 
 JOIN patientTimeLine pt ON ot.patientTimeLineID = pt.id 
 JOIN patients p ON pt.patientID = p.id 
 WHERE ot.status= ? AND ot.hospitalID=?`;
const queryGetSurgeryTypes = `SELECT 
    surgeryType AS SurgeryType,
    COUNT(*) AS PatientCount
FROM 
    operationTheatre
WHERE 
    hospitalID = ?
     AND (YEAR(addedOn) = ? )  
    AND (? = '' OR MONTH(addedOn) = ?)
GROUP BY 
    surgeryType
ORDER BY 
    PatientCount DESC`;

// `===for surgeon==
const querygetSurgeonSurgeryTypesInfo = `
SELECT 
    surgeryType AS SurgeryType,
    COUNT(*) AS PatientCount
FROM 
    operationTheatre
INNER JOIN 
    schedule 
ON 
    operationTheatre.patientTimeLineID = schedule.patientTimeLineId
WHERE 
    schedule.hospitalID = ?
    AND schedule.userID = ?
    AND (YEAR(schedule.addedOn) = ?)
    AND (? = '' OR MONTH(schedule.addedOn) = ?)
GROUP BY 
    surgeryType
ORDER BY 
    PatientCount DESC;
`;

const queryGetApprovedRejected = `
SELECT 
    SUM(CASE WHEN ot.status = 'rejected' THEN 1 ELSE 0 END) AS RejectedCount,
    SUM(CASE WHEN ot.status IN ('approved', 'scheduled', 'completed') THEN 1 ELSE 0 END) AS ApprovedCount
FROM 
    operationTheatre ot
JOIN 
    patientDoctors pd
ON 
    ot.patientTimeLineID = pd.patientTimeLineID
WHERE 
    pd.doctorID = ?
    AND ot.hospitalID = ?
    AND (YEAR(ot.addedOn) = ?)
    AND (MONTH(ot.addedOn) = ? OR ? = '')

`;
const queryInsertphysicalExamination = `
UPDATE operationTheatre SET physicalExamination = ? WHERE patientTimeLineID = ?`;
const queryInsertpreopRecord = `UPDATE operationTheatre SET preopRecord = ? , status = ? , rejectedTime = ?,rejectReason = ? WHERE patientTimeLineID = ?`;
const queryInsertpreopRecordApproved = `UPDATE operationTheatre SET preopRecord = ? , status = ? ,approvedTime=?, rejectReason = ? WHERE patientTimeLineID = ?`;
const queryInsertanesthesiaRecord = `UPDATE operationTheatre SET anesthesiaRecord = ? WHERE patientTimeLineID = ?`;
const queryInsertpostopRecord = `UPDATE operationTheatre SET postopRecord = ? WHERE patientTimeLineID = ?`;
const queryUpdatePendingStatusApprove = `UPDATE operationTheatre SET status = "approved" WHERE patientTimeLineID = ?`;
const queryUpdatePendingStatusRejected = `UPDATE operationTheatre SET status = "rejected" WHERE patientTimeLineID = ?`;
const queryDeactivateExistingDoctors = `UPDATE patientDoctors SET active = false WHERE patientTimeLineID = ? AND doctorID = ? AND hospitalID = ? AND scope = "anesthesia"`;
const queryGetPatientDetailsByType = `
SELECT p.*,users.firstName,users.lastName, ot.patientTimeLineID, ot.status, d.name as department
FROM operationTheatre ot 
JOIN patientTimeLine pt ON ot.patientTimeLineID = pt.id 
LEFT JOIN departments d on pt.departmentID = d.id
LEFT JOIN patientDoctors on pt.id = patientDoctors.patientTimeLineID
LEFT JOIN users on patientDoctors.doctorID = users.id
JOIN patients p ON pt.patientID = p.id
WHERE (ot.status = ? or ot.status = "scheduled") AND ot.patientType = ? AND ot.hospitalID=? AND users.id = ?
order by ot.id desc`;
const queryGetOtStatus = `
SELECT status FROM operationTheatre
 WHERE patientTimeLineID = ? and hospitalID = ?`;
const queryGetOtData = `SELECT * FROM operationTheatre WHERE patientTimeLineID = ? AND hospitalID = ?`;
const queryUpdateStatus = `
UPDATE operationTheatre SET status = ? ,scheduleTime=?
WHERE patientTimeLineID = ? AND hospitalID = ?`;
const queryGetOTPatientTypeCount = `
SELECT 
    p.*, 
    users.firstName, 
    users.lastName, 
    ot.patientTimeLineID
FROM 
    operationTheatre ot
JOIN 
    patientTimeLine pt ON ot.patientTimeLineID = pt.id
LEFT JOIN 
    patientDoctors ON pt.id = patientDoctors.patientTimeLineID
LEFT JOIN 
    users ON patientDoctors.doctorID = users.id
JOIN 
    patients p ON pt.patientID = p.id
WHERE 
    (ot.status = ? OR ot.status = "scheduled") 
    AND ot.patientType = ? 
    AND ot.hospitalID = ? 
    AND patientDoctors.doctorID = ?
    AND YEAR(ot.addedOn) = ?
    AND (MONTH(ot.addedOn) = ? OR '' =?)
ORDER BY 
    ot.id DESC`;

const queryInsertphysicalExaminationRedZone = `INSERT INTO physicalExamination(physicalExaminationData,patientTimeLineID, hospitalID) VALUES (?,?,?)`;

const querygetpostopRecord = `SELECT * FROM operationTheatre WHERE hospitalID =? AND patientTimeLineID=?`;

module.exports = {
  queryGetOTPatientTypeCount,
  queryChecktimeLineIdExist,
  queryInsertNewRowOt,
  queryGetQueryStatus,
  queryInsertphysicalExamination,
  queryInsertpreopRecord,
  queryInsertpreopRecordApproved,
  queryInsertanesthesiaRecord,
  queryInsertpostopRecord,
  queryUpdatePendingStatusApprove,
  queryUpdatePendingStatusRejected,
  queryDeactivateExistingDoctors,
  queryGetPatientDetailsByType,
  queryGetOtStatus,
  queryGetOtData,
  queryUpdateStatus,
  queryInsertphysicalExaminationRedZone,
  queryGetSurgeryTypes,
  queryGetApprovedRejected,
  querygetSurgeonSurgeryTypesInfo,
  querygetpostopRecord
};
