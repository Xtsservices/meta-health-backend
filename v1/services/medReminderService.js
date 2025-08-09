const pool = require("../db/conn");
const { medicineSchema } = require("../helper/validators/medReminderValidator");
const {
  updateReminderSchema
} = require("../helper/validators/medReminderValidator");
const {
  queryInsertMedicine,
  queryInsertMedicineReminders
} = require("../queries/medicineQueries");

const {
  queryUpdateMedReminder,
  queryGetReminderByID
} = require("../queries/medReminderQueries");

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET MEDICINE REMINDER BY ID
 */
const getReminderById = async (id) => {
  try {
    const result = await pool.query(queryGetReminderByID, [id]);

    if (!result[0][0]) throw new Error("Failed to get Reminder");

    return result[0][0];
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * ** METHOD : PATCH
 * ** DESCRIPTION : UPDATE MEDICINE REMINDER BY ID ,
 * **   update userID with user updating the doseStatus
 * **   doseStatus : 1 - given, 2 - not required
 * ** // the userI
 */
async function checkAsperNeed(medicineID) {
  const medQuery = `SELECT * FROM medicines WHERE id = ?`;
  const [validatedMedicines] = await pool.query(medQuery, [medicineID]);

  const medicineValues = validatedMedicines.map((item) => {
    return [
      item.timeLineID,
      item.userID,
      item.medicineType,
      item.medicineName,
      item.daysCount,
      item.doseCount,
      item.medicationTime,
      item.doseTimings,
      item.notes
    ];
  });

  const reminders = [];
  const queryInsertMedicine =
    "INSERT INTO medicines " +
    "(timeLineID, userID, medicineType, medicineName, daysCount, doseCount, medicationTime, doseTimings, notes) " +
    "VALUES ?";

  try {
    const [response] = await pool.query(queryInsertMedicine, [medicineValues]);

    for (let m = 0; m < validatedMedicines.length; m++) {
      const medicineData = validatedMedicines[m];
      const id = response.insertId + m;
      for (let i = 0; i < medicineData.daysCount; i++) {
        const day = i + 1 + "/" + medicineData.daysCount;
        const date = new Date();
        const userID = medicineData.userID;
        date.setDate(date.getDate() + i);
        for (let j = 0; j < medicineData.doseCount; j++) {
          let doseTime = "";
          if (medicineData.doseTimings) {
            const doseTimingsArray = medicineData.doseTimings.split(",");
            if (doseTimingsArray.length > j) {
              doseTime = doseTimingsArray[j];
            }
          }
          if (doseTime) {
            const [hours, minutes] = doseTime.split(":");
            const reminderDate = new Date(date);
            reminderDate.setHours(hours, minutes, 0, 0);
            // Adjust for timezone if necessary
            // reminderDate.setHours(reminderDate.getHours() - 5, reminderDate.getMinutes() - 30, 0, 0);
            reminders.push([id, reminderDate, day, userID]);
          }
        }
      }
    }
    const queryInsertMedicineReminders =
      "INSERT INTO medicineReminders (medicineID,dosageTime,day,userID) VALUES ?";
    await pool.query(queryInsertMedicineReminders, [reminders]);
  } catch (error) {
    console.error("Error executing query:", error);
  }
}

const updateReminder = async (
  id,
  userID,
  doseStatus,
  note,
  medicineID,
  medicationTime
) => {
  const givenTime = new Date();

  try {
    await updateReminderSchema.validateAsync({ userID, doseStatus, note });
    const result = await pool.query(queryUpdateMedReminder, [
      userID,
      doseStatus,
      note,
      givenTime,
      id
    ]);
    const { changedRows } = result[0];
    if (!changedRows) throw new Error("Failed to update reminder");
    const reminder = await pool.query(queryGetReminderByID, [id]);
    //checking this medicine type is as per need, add medicine to medicines
    if (doseStatus == 1 && medicationTime == "As Per Need") {
      await checkAsperNeed(medicineID);
    }
    return reminder[0][0];
  } catch (err) {
    throw new Error(err.message);
  }
};

module.exports = {
  getReminderById,
  updateReminder
};
