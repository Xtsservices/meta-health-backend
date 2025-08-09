const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord,
  notAllowed
} = require("../utils/errors");
const pool = require("../db/conn");

async function createShift(req, res) {
  console.log("=========================shift==========================");
  try {
    const hospitalID = req.params.hospitalID;
    const { startTime, endTime } = req.body;
    // Check if the request body contains the required fields
    if (!startTime || !endTime) {
      return res.status(400).json({ error: missingBody });
    }

    const shift = await roosterServices.createShift(
      startTime,
      endTime,
      hospitalID
    );

    return res.status(201).send({
      message: "success",
      shift: shift
    });

    // Check if the shift was successfully created
    // if (result.rows.length === 0) {
    //   return res.status(500).send({ error: serverError });
    // }

    // Return the newly created shift
    // const newShift = result.rows[0];
  } catch (error) {
    console.error("Error creating shift:", error);
    return res.status(500).json({ error: serverError });
  }
}

const roosterServices = require("../services/roosterServices");

async function createRooster(req, res) {
  const { date, shiftID, staffList } = req.body;
  const hospitalID = req.params.hospitalID;

  try {
    const result = await roosterServices.createRooster(
      date,
      shiftID,
      hospitalID,
      staffList
    );
    res.status(201).send({ message: result.message, rooster: result.rooster });
  } catch (error) {
    console.error("Error in createRooster:", error.message);
    if (error.message.includes("Shift ID")) {
      res.status(400).send({ message: error.message });
    } else if (error.message.includes("A rooster already exists")) {
      res.status(200).send({ message: error.message });
    } else if (error.message.includes("is on leave on")) {
      res.status(400).send({ message: error.message });
    } else {
      res.status(500).send({ message: "Internal server error" });
    }
  }
}

async function createLeaveEntries(req, res) {
  const leaveList = req.body;
  const hospitalID = req.params.hospitalID;
  try {
    const result = await roosterServices.createLeaveEntries(
      leaveList,
      hospitalID
    );
    res.status(201).json({ message: "success" });
  } catch (error) {
    res.status(500).send({ message: "Internal server error" });
  }
}

async function cancelLeave(req, res) {
  const { staffID, date } = req.body;
  const hospitalID = req.params.hospitalID;

  try {
    await roosterServices.cancelLeave(staffID, date, hospitalID);
    res.status(200).send({ message: "success" });
  } catch (error) {
    res.status(500).send({ message: "Internal server error" });
  }
}

async function getStaffStatus(req, res) {
  const hospitalID = req.params.hospitalID;
  const currentDate = new Date().toISOString().split("T")[0]; // Get current date in YYYY-MM-DD format
  let connection;
  try {
    connection = await pool.getConnection();

    // Get count of staff on duty for the current date
    const getStaffStatusonDutyQuery = `
      SELECT COUNT(*) AS count FROM onduty WHERE hospitalID = ? AND shift_date = ?
    `;

    const [onDutyRows] = await connection.query(getStaffStatusonDutyQuery, [
      hospitalID,
      currentDate
    ]);
    const onDutyCount = onDutyRows[0].count;

    // Get staff on duty for the current date
    const getOnDutyQuery = `
      SELECT * FROM onduty WHERE hospitalID = ? AND shift_date = ?
    `;
    const [onDutyStaff] = await connection.query(getOnDutyQuery, [
      hospitalID,
      currentDate
    ]);

    // Get count of staff on leave for the current date
    const onLeaveQuery = `
      SELECT COUNT(*) AS count FROM onleave WHERE hospitalID = ? AND leave_date = ?
    `;
    const [onLeaveRows] = await connection.query(onLeaveQuery, [
      hospitalID,
      currentDate
    ]);
    const onLeaveCount = onLeaveRows[0].count;

    // Get staff on leave for the current date
    const getOnLeaveQuery = `
      SELECT * FROM onleave WHERE hospitalID = ? AND leave_date = ?
    `;
    const [onLeaveStaff] = await connection.query(getOnLeaveQuery, [
      hospitalID,
      currentDate
    ]);

    res.status(200).send({
      onDutyCount,
      onDutyStaff,
      onLeaveCount,
      onLeaveStaff
    });
  } catch (error) {
    console.error("Error getting staff status:", error);
    res.status(500).send({ message: "Internal server error" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

async function getRoosterListByMonthAndYear(req, res) {
  const { month, year, hospitalID } = req.params;

  try {
    const roosterList = await roosterServices.getRoosterListByMonthAndYear(
      month,
      year,
      hospitalID
    );
    return res.status(200).send({ message: "success", roosterList });
  } catch (error) {
    console.error("Error getting rooster list:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getAllShifts(req, res) {
  try {
    const { hospitalID } = req.params;

    const shiftRows = await roosterServices.getAllShifts(hospitalID);

    res.status(200).send({ message: "success", shifts: shiftRows });
  } catch (error) {
    console.error("Error getting all shifts:", error);
    res.status(500).send({ message: "Internal server error" });
  }
}

async function deactivateShift(req, res) {
  try {
    const { shiftID, hospitalID } = req.params;

    await roosterServices.deactivateShift(shiftID, hospitalID);

    return res.status(200).send({ message: "success" });
  } catch (error) {
    console.error("Error deactivating shift:", error);
    res.status(500).send({ message: "Internal server error" });
  }
}

async function updateRooster(req, res) {
  const { date, shiftID, staffList } = req.body;
  const hospitalID = req.params.hospitalID;
  const roosterID = req.params.roosterID;

  let connection;
  try {
    const updatedRooster = await roosterServices.updateRooster(
      date,
      shiftID,
      staffList,
      hospitalID,
      roosterID
    );

    res.status(200).send({
      message: "success",
      rooster: updatedRooster
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Error updating rooster:", error);
    res.status(500).send({ message: "Error updating rooster" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

module.exports = {
  createShift,
  createRooster,
  createLeaveEntries,
  cancelLeave,
  getStaffStatus,
  getRoosterListByMonthAndYear,
  deactivateShift,
  getAllShifts,
  updateRooster
};
