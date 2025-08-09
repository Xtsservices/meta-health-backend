const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord
} = require("../utils/errors");

const pool = require("../db/conn");
const medicineServices = require("../services/medicineService");

const queryGetAllMedicinesByStatus =
  "SELECT * FROM medicines WHERE timeLineID=? AND medStatus=? ORDER BY addedOn Desc";
//

const getAllPreviousMedListQuery =
  "SELECT * FROM medicines WHERE timeLineID=? ORDER BY addedOn Desc";

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

/**
 * *** METHOD :  GET
 * *** DESCRIPTION : GET MEDICINES
 */
const getMedicines = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  if (!hospitalID) return missingBody(res, "hospitalID is missing");

  const { text } = req.body;

  const fetchPharamcyAccess = `SELECT scope FROM users where role = 9999 and hospitalID = ?`;

  const fetchMedicineQuery = `SELECT Medicine_Name, Content_Name
  FROM medicineList
  WHERE LOWER(Medicine_Name) LIKE LOWER('%${text}%') LIMIT 100`;

  const fetchMedicineQueryPharmacy = `SELECT name as Medicine_Name FROM medicineInventory
  WHERE hospitalID=? AND LOWER(name) LIKE LOWER('%${text}%') LIMIT 100`;

  try {
    let [response] = await pool.query(fetchPharamcyAccess, [hospitalID]);

    console.log("response[0]", response[0]);

    if (response[0].scope == null) {
      const results = await pool.query(fetchMedicineQuery);
      res.status(200).send({
        message: "success",
        medicines: results[0]
      });
    } else {
      let scopeSplit = response[0].scope.split("#");
      if (scopeSplit.includes("5011")) {
        const results = await pool.query(fetchMedicineQueryPharmacy, [
          hospitalID
        ]);
        console.log(results);

        res.status(200).send({
          message: "success",
          medicines: results[0]
        });
      } else {
        const results = await pool.query(fetchMedicineQuery);
        res.status(200).send({
          message: "success",
          medicines: results[0]
        });
      }
    }
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : POST,
 * ** DESCRIPTION : ADD MEDICINE FIELDS
 */
const addMedicine = async (req, res) => {
  const medicines = req.body.medicines;
  try {
    const validatedMedicines = await medicineServices.addMedicine(medicines);
    res.status(201).send({
      message: "success",
      medicines: validatedMedicines
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET,
 * ** DESCRIPTION : Get Single Medicine from id
 */
const getMedicineFromID = async (req, res) => {
  const timeLineID = req.params.timeLineID;
  const id = req.params.id; // medicine ID
  try {
    const result = await medicineServices.getMedicineFromID(timeLineID, id);

    res.status(200).send({
      message: "success",
      medicine: result
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTON  : GET ALL MEDICINES FROM TimeLineID
 */
const getAllMedicines = async (req, res) => {
  const timeLineID = req.params.timeLineID;
  try {
    const result = await medicineServices.getAllMedicines(timeLineID);
    res.status(200).send({
      message: "success",
      medicines: result
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * * METHOD : GET
 * ** DESCRIPTON  : GET ALL MEDICINES FROM TimeLineID Based on status
 * ** Status can be 0 - initialized, 1 -completed
 */
const getAllMedicinesFromStatus = async (req, res) => {
  const timeLineID = req.params.timeLineID;
  const medStatus = req.params.medStatus; // 0 - initialized and 1 - completed
  try {
    const result = await pool.query(queryGetAllMedicinesByStatus, [
      timeLineID,
      medStatus
    ]);
    res.status(200).send({
      message: "success",
      medicines: result[0]
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * * METHOD : GET
 * * DESCRIPTION : GET ALL MEDICINE REMINDERS FROM TIMELINE ID
 */
const getAllMedicineReminders = async (req, res) => {
  const timeLineID = req.params.timeLineID;
  try {
    const results = await medicineServices.getAllMedicineReminders(timeLineID);

    res.status(200).send({
      message: "success",
      reminders: results
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * * METHOD : GET
 * * DESCRIPTION : GET ALL previous MEDICINES
 */
const getAllPreviousmedlist = async (req, res) => {
  const timeLineID = req.params.timeLineID;

  try {
    const results = await pool.query(getAllPreviousMedListQuery, [timeLineID]);
    res.status(200).send({
      message: "success",
      previousMedList: results[0]
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * * METHOD : GET
 * * DESCRIPTION : GET ALL MEDICINE REMINDERS FROM TIMELINE ID LESS THAN GIVEN TIMESTAMP
 */
const getAllMedicineRemindersFromDateTime = async (req, res) => {
  const timeLineID = req.params.timeLineID;
  const dateTime = req.params.dateTime;
  try {
    const results = await pool.query(getAllMedicinesRemindersFromTimeStamp, [
      timeLineID,
      dateTime
    ]);
    // const reminders = results[0]
    // reminders.map((item)=>{
    //     const dateObject = new Date(item.dosageTime);
    //     const formattedDate = format(dateObject, "dd/MM/yyyy, HH:mm")
    //     item.dosageTime = formattedDate
    // })
    res.status(200).send({
      message: "success",
      reminders: results[0]
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getMedicineNotifications = async (req, res) => {
  const timeLineID = req.params.timeLineID;
  try {
    const results = await medicineServices.getMedicineNotifications(timeLineID);

    res.status(200).send({
      message: "success",
      reminders: results
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const testTimeStamp = async (req, res) => {
  const time = req.body.timeStamp;
  res.status(200).send({
    message: "success",
    time: time
  });
};

const getChartReminders = async (req, res) => {
  const timeLineLine = req.params.timeLineID;
  let date = req.query.date;
  if (!date) {
    date = new Date();
  }
  try {
    const result = await medicineServices.getChartReminders(timeLineLine, date);

    res.status(200).send({
      message: "success",
      result: result
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

function incrementDate(date, increment) {
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

module.exports = {
  addMedicine,
  getMedicineFromID,
  getAllMedicines,
  getAllMedicinesFromStatus,
  getAllMedicineReminders,
  getAllPreviousmedlist,
  getAllMedicineRemindersFromDateTime,
  getMedicineNotifications,
  testTimeStamp,
  getChartReminders,
  getMedicines
};
