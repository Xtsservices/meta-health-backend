const queryInsertMedicine =
  "INSERT INTO medicines " +
  "(timeLineID,userID,medicineType,medicineName,daysCount,doseCount,medicationTime,doseTimings,notes) " +
  "VALUES ?";
const querySetID = "SET @medicineID = LAST_INSERT_ID()";
const queryInsertMedicineReminders =
  "INSERT INTO medicineReminders (medicineID,dosageTime,day,userID) VALUES ?";

const queryGetAllMedicines =
  "SELECT * FROM medicines WHERE timeLineID=? ORDER BY addedOn Desc";
const queryGetAllMedicinesByStatus =
  "SELECT * FROM medicines WHERE timeLineID=? AND medStatus=? ORDER BY addedOn Desc";
const queryGetMedicineFromID =
  "SELECT * FROM medicines WHERE timeLineID=? AND id=?";

const getAllMedicinesReminders = `SELECT medicineReminders.id,medicineReminders.medicineID, medicines.medicineType,
    medicines.medicineName,medicines.medicationTime,medicines.daysCount,medicines.doseCount,medicines.medicineType,
    medicineReminders.userID,users.firstName,users.lastName,users.role,medicineReminders.dosageTime,
    medicineReminders.givenTime,medicineReminders.doseStatus,medicineReminders.note
    FROM medicines
    LEFT join medicineReminders
    ON medicines.id=medicineReminders.medicineID
    LEFT JOIN users
    on medicineReminders.userID=users.id
    WHERE medicines.timeLineID=?
    ORDER by dosageTime DESC`;

const queryGetMedicinesNotifications = `SELECT medicineReminders.id,medicines.medicineType,
    medicines.medicineName,medicines.medicationTime,medicines.daysCount,medicineReminders.day,
    medicineReminders.userID,users.firstName,users.lastName,users.role,medicineReminders.dosageTime,
    medicineReminders.givenTime,medicineReminders.doseStatus,medicineReminders.note
    FROM medicines
    LEFT join medicineReminders
    ON medicines.id=medicineReminders.medicineID
    LEFT JOIN users
    on medicineReminders.userID=users.id
    WHERE medicines.timeLineID=? AND medicineReminders.dosageTime>=?
    ORDER by dosageTime ASC`;

const getAllMedicinesRemindersFromTimeStamp = `SELECT medicineReminders.id,medicines.medicineType,
    medicines.medicineName,medicineReminders.userID,medicineReminders.dosageTime,medicineReminders.day,
    medicineReminders.givenTime,medicineReminders.doseStatus 
    FROM medicines 
    LEFT join medicineReminders 
    ON medicines.id=medicineReminders.medicineID 
    LEFT JOIN users
    on medicineReminders.userID=users.id
    WHERE medicines.timeLineID=? AND dosageTime<? 
    ORDER by dosageTime DESC`;

const queryGetMedRemindersForChart = `SELECT medicineReminders.id,medicines.medicineName,medicineReminders.givenTime from medicines 
    LEFT JOIN medicineReminders ON medicineReminders.medicineID=medicines.id
    WHERE timeLineID=? AND medicineReminders.doseStatus=1 AND (medicineReminders.givenTime BETWEEN ? AND ?)`;

module.exports = {
  queryInsertMedicine,
  querySetID,
  queryInsertMedicineReminders,
  queryGetAllMedicines,
  queryGetAllMedicinesByStatus,
  queryGetMedicineFromID,
  getAllMedicinesReminders,
  queryGetMedicinesNotifications,
  getAllMedicinesRemindersFromTimeStamp,
  queryGetMedRemindersForChart
};
