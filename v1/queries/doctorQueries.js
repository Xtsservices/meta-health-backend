const queryInsertPatientDoctorForHanshake = `INSERT INTO patientDoctors ( patientTimeLineID, doctorID,category, hospitalID,scope) VALUES (?, ?, ?, ?, ?)`;

const queryInsertPatientDoctor = `INSERT INTO patientDoctors ( patientTimeLineID, doctorID, purpose, category, scope,hospitalID) VALUES (?, ?, ?, ?,?, ?)`;
const queryDoctors = `SELECT * FROM patientDoctors WHERE patientTimeLineID = ? AND hospitalID = ?`;
const queryDeactivateExistingDoctors = `UPDATE patientDoctors SET active = false WHERE patientTimeLineID = ? AND doctorID = ? AND hospitalID = ?`;
const queryFetchDoctorsByPatientTimelineID = `SELECT patientDoctors.id AS patientDoctorID, patientDoctors.patientTimeLineID, patientDoctors.doctorID,
patientDoctors.purpose,patientDoctors.hospitalID, patientDoctors.active, patientDoctors.category,users.firstName, users.lastName, departments.name as department,patientDoctors.assignedDate
FROM patientDoctors 
INNER JOIN users on users.id=patientDoctors.doctorID
INNER JOIN departments on users.departmentID=departments.id
WHERE patientTimeLineID = ? AND patientDoctors.hospitalID = ?`;
const queryFetchDoctorsByDoctorID = `SELECT patientDoctors.id AS patientDoctorID, patientDoctors.patientTimeLineID, patientDoctors.doctorID,
patientDoctors.purpose,patientDoctors.hospitalID, patientDoctors.active, patientDoctors.category,users.firstName, users.lastName, departments.name as department,patientDoctors.assignedDate
FROM patientDoctors 
INNER JOIN users on users.id=patientDoctors.doctorID
INNER JOIN departments on users.departmentID=departments.id
WHERE patientTimeLineID = ? AND patientDoctors.hospitalID = ? AND doctorID=? AND active=true`;
const queryDeactivateALLDoctors = `UPDATE patientDoctors SET active = false WHERE patientTimeLineID = ? AND hospitalID = ?`;
const queryUpdateDoctorStatusById = `UPDATE patientDoctors 
SET active = false, purpose = ? 
WHERE active = true AND doctorID = ? AND patientTimeLineID = ? AND hospitalID = ?`;
const queryGetDoctorStatusById = `SELECT * FROM patientDoctors WHERE active = true AND doctorID=? AND patientTimeLineID=? AND hospitalID = ?`;
const queryUpdateAllDoctorStatus = `UPDATE patientDoctors SET active = false WHERE doctorID=? AND active=true AND hospitalID = ?`;
const queryGetAllDoctorStatus = `SELECT * FROM patientDoctors WHERE active = true AND doctorID=? AND hospitalID = ?`;
const queryInsertDoctorHandover = `INSERT INTO doctorHandover (hospitalID, patientTimeLineID, handshakingFrom, handshakingTo , handshakingBy, reason) VALUES (?,?,?,?,?,?)`;
const queryInsertBulkPatientDoctor = `INSERT INTO patientDoctors (patientTimeLineId, doctorId, purpose, category, hospitalID) VALUES ?`;
const queryInsertBulkDoctorHandover = `INSERT INTO doctorHandover (hospitalID, patientTimeLineID, handshakingFrom, handshakingTo , handshakingBy, reason) VALUES ?`;
const queryGetAllNurse = `select id , departmentID, phoneNo, firstName, lastName  from users where role = 2003 and hospitalID = ?;`;
const queryGetAllAppoinmentsList = `select * from DoctorAppointmentSchedule WHERE doctorID=? AND hospitalID = ?;`;
const queryUpdatePatientIsViewed =
  "UPDATE patients SET isViewed = 0 WHERE id = (SELECT patientID FROM patientTimeLine WHERE id = ? AND hospitalID = ?)";
module.exports = {
  queryInsertPatientDoctor,
  queryInsertPatientDoctorForHanshake,
  queryDoctors,
  queryDeactivateExistingDoctors,
  queryFetchDoctorsByPatientTimelineID,
  queryDeactivateALLDoctors,
  queryUpdateDoctorStatusById,
  queryUpdateAllDoctorStatus,
  queryGetDoctorStatusById,
  queryInsertDoctorHandover,
  queryGetAllDoctorStatus,
  queryInsertBulkPatientDoctor,
  queryInsertBulkDoctorHandover,
  queryFetchDoctorsByDoctorID,
  queryGetAllNurse,
  queryGetAllAppoinmentsList,
  queryUpdatePatientIsViewed
};
