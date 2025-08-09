const queryGetVitalAlerts = `SELECT * FROM vitalAlerts WHERE timeLineID=?`;
const queryGetHospitalAlerts = `select vitalAlerts.id,patients.id As paitentID,patients.pName As patientName,CONCAT(users.firstName, ' ', users.lastName) AS doctorName,
    vitalAlerts.alertType,vitalAlerts.alertMessage,
    vitalAlerts.alertValue,vitalAlerts.addedOn,vitalAlerts.seen from vitalAlerts
    LEFT JOIN patientTimeLine ON vitalAlerts.timeLineID=patientTimeLine.id
    LEFT JOIN patients ON patients.id=patientTimeLine.patientID
    LEFT JOIN users ON users.id=patientTimeLine.userID
    where patientTimeLine.hospitalID=? order by vitalAlerts.addedOn desc`;
const queryUpdateSeenStatus = `UPDATE vitalAlerts SET seen=? WHERE id=?`;
const queryGetAlertsCount = `select count(*) as count from vitalAlerts
    LEFT JOIN patientTimeLine ON vitalAlerts.timeLineID=patientTimeLine.id
    LEFT JOIN patients ON patients.id=patientTimeLine.patientID
    where patientTimeLine.hospitalID=? AND vitalAlerts.seen=?`;

module.exports = {
  queryGetVitalAlerts,
  queryGetHospitalAlerts,
  queryUpdateSeenStatus,
  queryGetAlertsCount
};
