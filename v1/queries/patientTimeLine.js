const queryCheckPatientTimeLinePresent = `
SELECT * FROM patientTimeLine 
WHERE id = ? AND hospitalID = ? AND patientEndStatus IS NULL`;
const queryCheckPatientTimeLine = `
SELECT * FROM patientTimeLine 
WHERE patientID = ? AND hospitalID = ? AND patientEndStatus IS NULL`;

module.exports = {
  queryCheckPatientTimeLinePresent,
  queryCheckPatientTimeLine
};
