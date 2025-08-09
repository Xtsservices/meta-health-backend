const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord,
  notAllowed
} = require("../utils/errors");
const pool = require("../db/conn");
const {
  checkShiftQuery,
  createcheckLeaveQuery,
  createcheckRoosterQuery,
  createRoosterQuery,
  createinsertOndutyQuery,
  createfetchRoosterQuery,
  updatecheckRoosterQuery,
  updatecheckLeaveQuery,
  updateRoosterQuery,
  deleteOndutyQuery,
  insertOndutyQuery,
  fetchRoosterQuery,
  createShiftquery,
  createShiftgetShiftQuery,
  insertLeaveQuery,
  deleteLeaveQuery,
  getStaffStatusonDutyQuery,
  getRoosterListByMonthAndYearQuery,
  getAllShiftsquery,
  deactivateShiftquery
} = require("../queries/roosterQueries");

async function createShift(startTime, endTime, hospitalID) {
  try {
    const values = [startTime, endTime, true, hospitalID];
    const [result] = await pool.query(createShiftquery, values);

    if (!result.insertId) throw new Error("Failed to add purchase");
    const [shift] = await pool.query(createShiftgetShiftQuery, [
      result.insertId
    ]);

    return shift[0];
  } catch (error) {
    throw error;
  }
}

async function createRooster(date, shiftID, hospitalID, staffList) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if shiftID exists

    const [shiftRows] = await connection.query(checkShiftQuery, [shiftID]);
    if (shiftRows.length === 0) {
      throw new Error(`Shift ID ${shiftID} does not exist`);
    }

    const [existingRoosterRows] = await connection.query(
      createcheckRoosterQuery,
      [date, shiftID, hospitalID]
    );

    if (existingRoosterRows.length > 0) {
      throw new Error(
        `A rooster already exists for ${date} and shift ID ${shiftID}`
      );
    }

    const [leaveRows] = await connection.query(createcheckLeaveQuery, [
      date,
      hospitalID
    ]);

    const staffOnLeave = leaveRows.map((row) => row.staffID);
    const staffOnLeaveToday = staffList.filter((staff) =>
      staffOnLeave.includes(staff.staffID)
    );

    if (staffOnLeaveToday.length > 0) {
      throw new Error(
        `${staffOnLeaveToday[0].doctorName} is on leave on ${date}`
      );
    }

    const [roosterResult] = await connection.query(createRoosterQuery, [
      date,
      shiftID,
      hospitalID
    ]);
    const roosterId = roosterResult.insertId;

    await Promise.all(
      staffList.map((staff) =>
        connection.query(createinsertOndutyQuery, [
          roosterId,
          staff.staffID,
          staff.doctorName,
          staff.departmentName,
          hospitalID
        ])
      )
    );

    await connection.commit();

    const [roosterRows] = await connection.query(createfetchRoosterQuery, [
      roosterId
    ]);
    return { message: "success", rooster: roosterRows[0] };
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

async function createLeaveEntries(leaveList, hospitalID) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    await Promise.all(
      leaveList.map(async (leave) => {
        const [insertResult] = await connection.query(insertLeaveQuery, [
          leave.staffID,
          leave.doctorName,
          leave.departmentName,
          leave.date,
          hospitalID
        ]);
      })
    );

    await connection.commit();

    return "success";
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

async function cancelLeave(staffID, date, hospitalID) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [deleteResult] = await connection.query(getStaffStatusonDutyQuery, [
      staffID,
      date,
      hospitalID
    ]);

    await connection.commit();

    if (deleteResult.affectedRows === 0) {
      throw new Error("Leave entry not found");
    }

    return "success";
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

async function getStaffStatus(req, res) {
  const hospitalID = req.params.hospitalID;
  const currentDate = new Date().toISOString().split("T")[0]; // Get current date in YYYY-MM-DD format
  let connection;
  try {
    connection = await pool.getConnection();

    // Get count of staff on duty for the current date
    const onDutyQuery = `
        SELECT COUNT(*) AS count FROM onduty WHERE hospitalID = ? AND date = ?
      `;
    const [onDutyRows] = await connection.query(onDutyQuery, [
      hospitalID,
      currentDate
    ]);
    const onDutyCount = onDutyRows[0].count;

    // Get staff on duty for the current date
    const getOnDutyQuery = `
        SELECT * FROM onduty WHERE hospitalID = ? AND date = ?
      `;
    const [onDutyStaff] = await connection.query(getOnDutyQuery, [
      hospitalID,
      currentDate
    ]);

    // Get count of staff on leave for the current date
    const onLeaveQuery = `
        SELECT COUNT(*) AS count FROM onleave WHERE hospitalID = ? AND date = ?
      `;
    const [onLeaveRows] = await connection.query(onLeaveQuery, [
      hospitalID,
      currentDate
    ]);
    const onLeaveCount = onLeaveRows[0].count;

    // Get staff on leave for the current date
    const getOnLeaveQuery = `
        SELECT * FROM onleave WHERE hospitalID = ? AND date = ?
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

async function getRoosterListByMonthAndYear(month, year, hospitalID) {
  try {
    const [roosterRows] = await pool.query(getRoosterListByMonthAndYearQuery, [
      year,
      month,
      hospitalID
    ]);

    // Grouping rooster entries by date and shiftID
    const roosterList = {};
    // console.log("rooster logs", roosterRows, year, month, hospitalID);
    roosterRows.forEach((row) => {
      const { date, shiftID, staffID, doctorName, departmentName, id } = row;
      if (!roosterList[date]) {
        roosterList[date] = {};
      }
      if (!roosterList[date][shiftID]) {
        roosterList[date][shiftID] = { staffList: [] };
      }
      roosterList[date][shiftID].id = id;
      roosterList[date][shiftID].staffList.push({
        staffID,
        doctorName,
        departmentName
      });
    });

    return roosterList;
  } catch (error) {
    throw new Error("Internal server error");
  }
}

async function getAllShifts(hospitalID) {
  try {
    const [shiftRows] = await pool.query(getAllShiftsquery, [hospitalID, true]);
    return shiftRows;
  } catch (error) {
    throw new Error("Internal server error");
  }
}

async function deactivateShift(shiftID, hospitalID) {
  try {
    await pool.query(deactivateShiftquery, [false, shiftID, hospitalID]);

    return "success";
  } catch (error) {
    console.error("Error deactivating shift:", error);
    throw new Error("Internal server error");
  }
}

async function updateRooster(date, shiftID, staffList, hospitalID, roosterID) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [existingRoosterRows] = await connection.query(
      updatecheckRoosterQuery,
      [roosterID, hospitalID]
    );

    if (existingRoosterRows.length === 0) {
      throw new Error("Roaster not found");
    }

    const [leaveRows] = await connection.query(updatecheckLeaveQuery, [
      date,
      hospitalID
    ]);
    const staffOnLeave = leaveRows.map((row) => row.staffID);
    const staffOnLeaveToday = staffList.filter((staff) =>
      staffOnLeave.includes(staff.staffID)
    );

    if (staffOnLeaveToday.length > 0) {
      await connection.rollback();
      throw new Error(
        `${staffOnLeaveToday[0].doctorName} is on leave on ${date}`
      );
    }

    await connection.query(updateRoosterQuery, [
      date,
      shiftID,
      roosterID,
      hospitalID
    ]);

    await connection.query(deleteOndutyQuery, [roosterID, hospitalID]);

    await Promise.all(
      staffList.map((staff) =>
        connection.query(insertOndutyQuery, [
          roosterID,
          staff.staffID,
          staff.doctorName,
          staff.departmentName,
          hospitalID
        ])
      )
    );

    await connection.commit();

    const [roosterRows] = await connection.query(fetchRoosterQuery, [
      roosterID
    ]);

    const updatedRooster = roosterRows[0];

    return updatedRooster;
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    throw error;
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
