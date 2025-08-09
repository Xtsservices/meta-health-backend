const queryInsertPrescription = `INSERT INTO prescriptions (hospitalID, medicine,medicineType,medicineTime,medicineDuration,medicineFrequency,
medicineNotes,test,notes,diagnosis,timeLineID,userID,diet,advice,followUp,followUpDate) 
VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

const queryGetAllPrescription = `SELECT  id,medicine,medicineType,medicineTime,medicineDuration,medicineFrequency,medicineNotes,test,meddosage,
notes,diagnosis,timelineID,userID,diet,advice,followUp,followUpDate,addedOn,medicineStartDate, status, dosageUnit FROM prescriptions WHERE hospitalID=? AND patientID=? ORDER BY addedOn DESC`;

const queryPatientTimelineByID = `SELECT patientStartStatus,patientEndStatus,patientID FROM patientTimeLine where id=?`;
const queryInsertFollowUp = `INSERT INTO followUp (timelineID,date,status) VALUES (?,?,?)`;
const queryUpdatePreviousFollowUp = `UPDATE followUp SET status=? WHERE timelineID=? AND status=?`;
const queryUpdatePatientTimeLine = `UPDATE patientTimeLine SET patientEndStatus=?,dischargeType=? WHERE id=?`;
const queryUpdatePatientRevisit = `UPDATE patients 
SET ptype=? 
WHERE hospitalID=? AND id=?`;
const queryGetFullPatientByID = `SELECT patients.id,patients.hospitalID,patients.deviceID,patients.pID,
patients.pUHID,patients.ptype,patients.category,patients.pName,users.firstName,users.lastName,departments.name as department,patients.dob,patients.gender,
patients.weight,patients.height,patients.phoneNumber,patients.email,patients.address,patients.insurance,patients.insuranceNumber,
patients.insuranceCompany,patients.city,patients.state,patients.pinCode,patients.referredBy,patients.photo,patientTimeLine.startTime,patientTimeLine.endTime,
patientTimeLine.id AS patientTimeLineID,patientTimeLine.dischargeType,patientTimeLine.diet,patientTimeLine.wardID,patientTimeLine.userID,
patientTimeLine.advice,patientTimeLine.followUp,patientTimeLine.icd,followUp.status AS followUpStatus, followUp.date AS followUpDate,followUp.addedOn AS followUpAddedOn
FROM patients
INNER JOIN patientTimeLine on patients.id=patientTimeLine.patientID 
INNER JOIN users on patientTimeLine.userID=users.id 
INNER JOIN departments on users.departmentID=departments.id 
LEFT JOIN followUp on followUp.timelineID=patientTimeLine.id
WHERE patients.hospitalID=? AND patients.id=? ORDER BY followUpAddedOn DESC LIMIT 1`;

module.exports = {
  queryInsertPrescription,
  queryGetAllPrescription,
  queryPatientTimelineByID,
  queryInsertFollowUp,
  queryUpdatePreviousFollowUp,
  queryUpdatePatientTimeLine,
  queryUpdatePatientRevisit,
  queryGetFullPatientByID
};
