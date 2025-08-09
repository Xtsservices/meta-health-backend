const queryGetScheduleData = `
SELECT  ot.surgeryType , ot.patientType, p.pName, p.pID 
FROM schedule sch 
JOIN operationTheatre ot ON sch.patientTimeLineID = ot.patientTimeLineID 
JOIN patientTimeLine pt ON ot.patientTimeLineID = pt.patientID 
JOIN patients p ON pt.patientID = p.id 
WHERE sch.hospitalID = ? AND sch.patientTimeLineID = ? AND sch.active = true;`;
const queryViewSchedule = `
SELECT sch.*, ot.surgeryType , ot.patientType , p.pName, p.pID
 FROM schedule sch JOIN operationTheatre ot ON sch.patientTimeLineID = ot.patientTimeLineID
 JOIN patientTimeLine pt ON ot.patientTimeLineID = pt.id
JOIN patients p ON pt.patientID = p.id
WHERE  sch.hospitalID = ? AND sch.userID = ? AND sch.active = true;`;
const queryaddSchedule = `INSERT INTO schedule (hospitalID, userId, patientTimeLineId, startTime, endTime, roomId,attendees) VALUES (?,?,?,?,?,?,?)`;
const queryCheckPatientTimeLinePresentSchedule = `SELECT * FROM schedule WHERE hospitalID = ? AND patientTimeLineId = ?`;

module.exports = {
  queryaddSchedule,
  queryViewSchedule,
  queryCheckPatientTimeLinePresentSchedule,
  queryGetScheduleData
};
