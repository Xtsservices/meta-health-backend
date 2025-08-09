const { scheduleApiCall } = require("../controllers/jobScheduler");
const {
  queryViewSchedule,
  queryaddSchedule,
  queryCheckPatientTimeLinePresentSchedule,
  queryGetScheduleData
} = require("../queries/scheduleQueries");
const { addDoctor } = require("../services/doctorService");
const { updateStatus } = require("../services/operationTheatreService");
const pool = require("../db/conn");
const viewSchedule = async (hospitalID, userId) => {
  try {
    let [result] = await pool.query(queryViewSchedule, [hospitalID, userId]);
    if (result.length > 0) {
      return {
        status: 200,
        data: result
      };
    }
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const addSchedule = async (
  hospitalID,
  userId,
  patientTimeLineId,
  startTime,
  endTime,
  roomId,
  attendees,
  patientID,
  baseURL,
  token
) => {
  try {
    let [result] = await pool.query(queryCheckPatientTimeLinePresentSchedule, [
      hospitalID,
      patientTimeLineId
    ]);
    if (result.length > 0) {
      return { status: 403, message: "Timeline already exists" };
    }
    [result] = await pool.query(queryaddSchedule, [
      hospitalID,
      userId,
      patientTimeLineId,
      startTime,
      endTime,
      roomId,
      attendees
    ]);
    if (result.affectedRows == 1) {
      const updatedStatus = await updateStatus(
        "scheduled",
        startTime,
        patientTimeLineId,
        hospitalID
      );
      if (updatedStatus.status != 200) {
        return { status: 500, message: "failed to update the OT status" };
      }

      let connection = await pool.getConnection();

      const doctorResponse = await addDoctor(
        connection,
        patientTimeLineId,
        userId,
        "secondary",
        hospitalID,
        "surgon for Surgery",
        "surgon"
      );
      if (doctorResponse.status == 201) {
        const date = new Date("2024-08-08T16:51:00");
        console.log("startTime", startTime);
        const cronExpression = `${date.getSeconds()} ${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${
          date.getMonth() + 1
        } *`;
        scheduleApiCall(cronExpression, hospitalID, patientID, baseURL, token);
        return {
          message: "Success",
          status: 201
        };
      } else {
        return { status: 500, message: "Failed to add anesthetic" };
      }
    } else {
      return { status: 500, message: "Failed to Schedule" };
    }
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

module.exports = {
  viewSchedule,
  addSchedule
};
