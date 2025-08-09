const insertMedicalHistory =
  "INSERT INTO medicalHistory " +
  "(patientID,userID,givenName,givenPhone,givenRelation,bloodGroup," +
  "bloodPressure,disease,foodAllergy,medicineAllergy,anaesthesia,meds," +
  "selfMeds,chestCondition,neurologicalDisorder,heartProblems,infections," +
  "mentalHealth,drugs,pregnant,hereditaryDisease,lumps,cancer, familyDisease) " +
  "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
//24
const queryFindPatientByID =
  "SELECT id FROM patients WHERE hospitalID=? AND id=?";
const queryGetMedicalHistoryByPatientID =
  "SELECT * FROM medicalHistory WHERE patientID=? ORDER BY addedOn DESC LIMIT 1";
const queryGetMedicalHistoryByID = "SELECT * FROM medicalHistory WHERE id=?";

module.exports = {
  insertMedicalHistory,
  queryFindPatientByID,
  queryGetMedicalHistoryByPatientID,
  queryGetMedicalHistoryByID
};
