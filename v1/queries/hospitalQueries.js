const queryCountHospitals = `SELECT 'Hospitals' AS tables, COUNT(*) AS Count FROM hospitals`;
const queryCountUsers = `SELECT 'Users' AS tables, COUNT(*) AS Count FROM users`;
const queryCountPatients = `SELECT 'Patients' AS tables, COUNT(*) AS Count FROM patients`;

module.exports = {
  queryCountHospitals,
  queryCountUsers,
  queryCountPatients
};
