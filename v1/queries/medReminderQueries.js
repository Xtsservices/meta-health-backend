const queryUpdateMedReminder =
  "UPDATE medicineReminders SET userID=?,doseStatus=?,note=?, givenTime=? WHERE id=?";
const queryGetReminderByID = `SELECT medicineReminders.id, 
    medicineReminders.userID,users.firstName,users.lastName,users.role,medicineReminders.dosageTime,
    medicineReminders.givenTime,medicineReminders.doseStatus,medicineReminders.note
    FROM medicineReminders
    LEFT JOIN users
    on medicineReminders.userID=users.id
    WHERE medicineReminders.id=?`;

module.exports = {
  queryUpdateMedReminder,
  queryGetReminderByID
};
