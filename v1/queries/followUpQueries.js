const { followUpStatus } = require("../utils/patientUtils");

const queryGetAllFollowUp = `SELECT * from followUp WHERE timelineID=? ORDER BY addedOn DESC`;

const queryActiveFollowUp = `SELECT date AS followUpDate,status AS followUpStatus,p.pName AS pName,t.patientID AS id,p.photo,p.email,t.hospitalID from followUp
INNER JOIN patientTimeLine t ON followUp.timelineID=t.id 
LEFT JOIN patientDoctors ON patientDoctors.patientTimeLineID = t.id
INNER JOIN patients p ON t.patientID=p.id WHERE followUp.status=${followUpStatus.active} AND
YEAR(date) = YEAR(CURDATE()) AND t.patientEndStatus IS NULL AND t.hospitalID=?  AND patientDoctors.doctorID= ? ORDER BY followUpDate DESC`;

// const queryActiveFollowUp = `SELECT date AS followUpDate,status AS followUpStatus,p.pName AS pName,t.patientID AS id,p.photo,p.email,t.hospitalID from followUp
// INNER JOIN patientTimeLine t ON followUp.timelineID=t.id
// INNER JOIN patients p ON t.patientID=p.id WHERE followUp.status=${followUpStatus.active} AND
// YEAR(date) = YEAR(CURDATE()) AND WEEK(date) = WEEK(CURDATE()) AND t.patientEndStatus IS NULL AND t.hospitalID=? ORDER BY followUpDate DESC`;

module.exports = {
  queryGetAllFollowUp,
  queryActiveFollowUp
};
