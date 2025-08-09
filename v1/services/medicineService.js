const pool = require("../db/conn");
const { medicineSchema } = require("../helper/validators/medicineValidator");
const { reminderSchema } = require("../helper/validators/medReminderValidator");
const medicineInventoryPatientsOrderService = require("../services/medicineInventoryPatientsOrderService");

const { format } = require("date-fns");

const {
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
} = require("../queries/medicineQueries");

/**
 * ** METHOD : POST,
 * ** DESCRIPTION : ADD MEDICINE FIELDS
 */
// const addMedicine = async (medicines) => {
//     let connection
//     try {
//         const validatedMedicines = await Promise.all(
//             medicines.map(async (item) => {
//                 return await medicineSchema.validateAsync(item);
//             })
//         );
//         const medicineValues = validatedMedicines.map((item) => {
//             return [item.timeLineID, item.userID,
//             item.medicineType, item.medicineName.toLowerCase(),
//             item.daysCount, item.doseCount, item.medicationTime, item.doseTimings, item.notes]
//         })

//         const reminders = []
//         connection = await pool.getConnection();
//         await connection.beginTransaction()
//         const response = await connection.query(queryInsertMedicine, [medicineValues])
//         // console.log(response[0].insertId)
//         for (let m = 0; m < validatedMedicines.length; m++) {
//             const medicineData = validatedMedicines[m]
//             const id = response[0].insertId + m
//             for (let i = 0; i < medicineData.daysCount; i++) {
//                 const day = (i+1)+"/"+medicineData.daysCount
//                 const date = new Date();
//                 date.setDate(date.getDate() + i);
//                 for (let j = 0; j < medicineData.doseCount; j++) {
//                     const doseTime = medicineData.doseTimings.split(',')[j];
//                     const [hours, minutes] =doseTime.split(':');
//                     const reminderDate = new Date(date);
//                     reminderDate.setHours(hours, minutes, 0, 0);
//                     //   const localTime = reminderDate.toLocaleTimeString();
//                     reminderDate.setHours(reminderDate.getHours()-5, reminderDate.getMinutes()-30, 0, 0);
//                     reminders.push([id, reminderDate,day]);
//                 }
//             }
//         }
//         // reminders.map((item)=>{
//         //     console.log(`item : ${item}`)
//         // })
//         const medremin = await connection.query(queryInsertMedicineReminders, [reminders])
//         await connection.commit();

//         const medID = response[0].insertId
//         for(let k=0;k<validatedMedicines.length;k++){
//             validatedMedicines[k].id = medID+k
//         }

//        return validatedMedicines
//     }
//     catch (err) {
//         if (err.isJoi === true) {
//             throw new (err.message);
//         }
//         if (connection) {
//             connection.rollback()
//         }
//         throw new Error (err.message);
//     } finally {
//         if (connection) {
//             connection.release();
//         }
//     }
// }

/**
 * ** METHOD : POST,
 * ** DESCRIPTION : ADD MEDICINE FIELDS
 */
const addMedicine = async (medicines) => {
  let connection;
  try {
    const validatedMedicines = await Promise.all(
      medicines.map(async (item) => {
        return await medicineSchema.validateAsync(item);
      })
    );
    connection = await pool.getConnection();

    // Check for existing medicines
    for (const medicine of validatedMedicines) {
      const medicationTimes = medicine.medicationTime
        .toLowerCase()
        .split(",")
        .map((time) => time.trim());

      const existingMedicineQuery = `
        SELECT * FROM medicines 
        WHERE 
            LOWER(medicineName) = ? 
            AND timeLineID = ?
            AND DATE_ADD(addedOn, INTERVAL daysCount DAY) > NOW()
    `;

      const [existingMedicines] = await connection.query(
        existingMedicineQuery,
        [medicine.medicineName.toLowerCase(), medicine.timeLineID]
      );

      let isDuplicate = false;

      for (const existingMedicine of existingMedicines) {
        const existingTimes = existingMedicine.medicationTime
          .toLowerCase()
          .split(",")
          .map((time) => time.trim());

        // Check if the new medicine's times match exactly with any existing medicine's times
        if (
          medicationTimes.length === existingTimes.length &&
          medicationTimes.every((time) => existingTimes.includes(time))
        ) {
          // Check if the existing medicine's days count is still valid
          const existingDaysCount = existingMedicine.daysCount;
          const daysElapsed = Math.floor(
            (new Date() - new Date(existingMedicine.addedOn)) /
              (1000 * 60 * 60 * 24)
          );
          if (daysElapsed < existingDaysCount) {
            isDuplicate = true;
            break; // No need to check further if a duplicate is found
          }
        }
      }

      if (isDuplicate) {
        throw new Error(
          `Medicine with name '${
            medicine.medicineName
          }' and medication times '${medicationTimes.join(
            ", "
          )}' already exists and its days count is not yet completed.`
        );
      }
    }

    // console.log("existingMedicines=====",existingMedicines)

    const medicineValues = validatedMedicines.map((item) => {
      return [
        item.timeLineID,
        item.userID,
        item.medicineType,
        item.medicineName.toLowerCase(),
        item.daysCount,
        item.doseCount,
        item.medicationTime,
        item.doseTimings,
        item.notes
      ];
    });

    const reminders = [];
    // connection = await pool.getConnection();
    await connection.beginTransaction();
    const response = await connection.query(queryInsertMedicine, [
      medicineValues
    ]);

    medicineInventoryPatientsOrderService.addPatientMedicineOrder(medicines);

    for (let m = 0; m < validatedMedicines.length; m++) {
      const medicineData = validatedMedicines[m];
      const id = response[0].insertId + m;
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
            // Adjusting reminderDate for timezone if necessary
            // reminderDate.setHours(reminderDate.getHours() - 5, reminderDate.getMinutes() - 30, 0, 0);
            reminders.push([id, reminderDate, day, userID]);
          }
        }
      }
    }
    const medicationTimings = medicines[0].medicationTime.split(",");
    const MedRemainders = await Promise.all(
      medicationTimings.map(async (e) => {
        const medremin = await connection.query(queryInsertMedicineReminders, [
          reminders
        ]);
        return medremin;
      })
    );

    await connection.commit();

    const medID = response[0].insertId;
    for (let k = 0; k < validatedMedicines.length; k++) {
      validatedMedicines[k].id = medID + k;
    }

    return validatedMedicines;
  } catch (err) {
    if (err.isJoi === true) {
      throw new Error(err.message);
    }
    if (connection) {
      connection.rollback();
    }
    throw new Error(err.message);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTON  : GET ALL MEDICINES FROM TimeLineID
 */
const getAllMedicines = async (timeLineID) => {
  try {
    const result = await pool.query(queryGetAllMedicines, [timeLineID]);

    return result[0];
  } catch (err) {
    throw new Error(err.message);
  }
};

function incrementDate(date, increment) {
  console.log(`increment : ${increment}`);
  const initialDate = new Date(date);
  if (increment) {
    initialDate.setDate(initialDate.getDate() + 1);
  }
  const year = initialDate.getFullYear();
  const month = (initialDate.getMonth() + 1).toString().padStart(2, "0");
  const day = initialDate.getDate().toString().padStart(2, "0");
  // date format ISO
  const newDateString = `${year}-${month}-${day}`;
  return newDateString;
}

const getChartReminders = async (timeLineLine, date) => {
  try {
    const currentDate = incrementDate(date, 0);
    const nextDate = incrementDate(date, 1);

    const [result] = await pool.query(queryGetMedRemindersForChart, [
      timeLineLine,
      currentDate,
      nextDate
    ]);

    return result;
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * ** METHOD : GET,
 * ** DESCRIPTION : Get Single Medicine from id
 */
const getMedicineFromID = async (timeLineID, id) => {
  try {
    const result = await pool.query(queryGetMedicineFromID, [timeLineID, id]);
    if (!result[0][0]) return resourceNotFound(res, "failed to get medicine");
    return result[0][0];
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * * METHOD : GET
 * * DESCRIPTION : GET ALL MEDICINE REMINDERS FROM TIMELINE ID
 */
const getAllMedicineReminders = async (timeLineID) => {
  try {
    const results = await pool.query(getAllMedicinesReminders, [timeLineID]);
    // const reminders = results[0]
    // reminders.map((item)=>{
    //     const dateObject = new Date(item.dosageTime);
    //     const formattedDate = format(dateObject, "dd/MM/yyyy, HH:mm")
    //     item.dosageTime = formattedDate
    // })

    return results[0];
  } catch (err) {
    throw new Error(err.message);
  }
};

const getMedicineNotifications = async (timeLineID) => {
  const currentDate = new Date().toISOString().split("T")[0];
  try {
    const results = await pool.query(queryGetMedicinesNotifications, [
      timeLineID,
      currentDate
    ]);
    const remindersByDate = {};
    results[0].forEach((reminder) => {
      const date = new Date(reminder.dosageTime);
      const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
      // const dosageDate = reminder.dosageTime.split('T')[0]; // Extract date portion
      if (!remindersByDate[formattedDate]) {
        remindersByDate[formattedDate] = [];
      }
      remindersByDate[formattedDate].push(reminder);
    });
    // console.log(`remindres : ${JSON.stringify(remindersByDate)}`)
    return remindersByDate;
  } catch (err) {
    throw new Error(err.message);
  }
};

module.exports = {
  addMedicine,
  getAllMedicines,
  getChartReminders,
  getMedicineFromID,
  getAllMedicineReminders,
  getMedicineNotifications
};
