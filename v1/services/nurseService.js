const pool = require("../db/conn");
const SCOPE_LIST = require("../utils/scope");
const crypto = require("crypto");
const {
  getAllHeadNurseFromHospitalQuery,
  getnursedashboardcountsquery,
  getuserScopesDepartment,
  getnursedashbaordMedicinesCount,
  addstaffLeavesquery,
  getAttendanceLogsquery,
  getheadnursepatientsquery,
  medicationAlertsQuery,
  getHeadNurseAllNurseFromHospitalQuery,
  addshiftschedulequery,
  getmyshiftscheduleQuery,
  getstaffleavesQuery,
  getshiftscheduleQuery,
  getnursepatientsquery,
  deletestaffleaveQuery,
  deletestaffhiftSchedulQuery,
  getstaffleavesCountQuery,
} = require("../queries/nurseQueries");

const ROLES_LIST = require("../utils/roles");
const {
  staffSchedulesSchema,
} = require("../helper/validators/addShiftScheduleValidator");
const { queryCheckPatientTimeLinePresent } = require("../queries/patientTimeLine");

//common function
async function getUserScopes(userID) {
  try {
    const [userScopes] = await pool.query(getuserScopesDepartment, [userID]);
    if (!userScopes.length) throw new Error("Scopes Not Found");

    const scopes = userScopes[0].scope.split("#");
    let pTypes = [];

    if (scopes.includes(SCOPE_LIST.inpatient.toString())) pTypes.push(2);
    if (scopes.includes(SCOPE_LIST.outpatient.toString())) pTypes.push(1);
    if (scopes.includes(SCOPE_LIST.triage.toString())) pTypes.push(3);

    if (pTypes.length === 0) throw new Error("No valid pType found");

    return {
      departmentID: userScopes[0].departmentID,
      pTypes,
    };
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getAllHeadNurseFromHospital(hospitalID) {
  try {
    const [results] = await pool.query(getAllHeadNurseFromHospitalQuery, [
      hospitalID,
    ]);
    return results;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getHeadNurseAllNurseFromHospital(userID) {
  try {
    const [results] = await pool.query(getHeadNurseAllNurseFromHospitalQuery, [
      userID,
    ]);
    return results;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getnursedashboardcounts(hospitalID, role, userID) {
  try {
    // Convert role to number to match ROLES_LIST
    const normalizedRole = Number(role);
    let departmentID, pTypes, pType, results;
    let wardID = null; // Initialize wardID
    const today = new Date().toISOString().split("T")[0];

    if (normalizedRole === ROLES_LIST.headNurse) {
      const [userScopes] = await pool.query(getuserScopesDepartment, [userID]);
      if (!userScopes.length) throw new Error("Scopes Not Found");

      ({ departmentID, pTypes } = await getUserScopes(userID));
      pType = pTypes;
    } else if (normalizedRole === ROLES_LIST.nurse) {
      const [schedules] = await pool.query(
        `SELECT * FROM staffSchedules 
         WHERE userID = ? AND hospitalID = ? AND ? BETWEEN fromDate AND toDate 
         LIMIT 1`,
        [userID, hospitalID, today]
      );
      if (!schedules.length) throw new Error("No schedule assigned");
      const schedule = schedules[0];
      departmentID = schedule.departmentID;
      pType = schedule.scope === 2 ? 1 : 2;
      if (schedule.scope !== 2) {
        wardID = schedule.wardID; // Set wardID for scope 1
      }
    } else {
      throw new Error("Invalid role");
    }

    let patientQuery = `
    SELECT 
        COUNT(DISTINCT CASE WHEN p.ptype != 21 AND pt.patientStartStatus IN (?) THEN pt.patientID END) AS activePatients,
        COUNT(DISTINCT CASE WHEN p.ptype = 21 AND pt.patientStartStatus IN (?) THEN pt.patientID END) AS dischargedPatients,
        COUNT(DISTINCT CASE WHEN pt.followUp = 1 AND pt.patientStartStatus IN (?) THEN pt.patientID END) AS followUpPatients
    FROM 
        patients AS p
    LEFT JOIN 
        patientTimeLine AS pt 
        ON p.id = pt.patientID
    WHERE 
        p.hospitalID = ?
        AND pt.departmentID = ?
  `;

    const patientQueryParams = [pType, pType, pType, hospitalID, departmentID];
    if (wardID) {
      patientQuery += ` AND pt.wardID = ?`;
      patientQueryParams.push(wardID);
    }

    const [patientresults] = await pool.query(patientQuery, patientQueryParams);

    // Define medicine alert count query

    let medicineQuery = `
    select count(*) as medicineAlerts 
from medicines
LEFT JOIN medicineReminders ON medicines.id=medicineReminders.medicineID
LEFt JOIN patientTimeLine As pt ON medicines.timeLineID = pt.id
where
medicineReminders.dosageTime > ?
AND pt.hospitalID = ?
AND pt.departmentID = ?
AND pt.patientStartStatus IN (?)
AND pt.patientEndStatus IS NULL
  `;


    const medicineQueryParams = [today, hospitalID, departmentID, pType];
    if (wardID) {
      medicineQuery += ` AND pt.wardID = ?`;
      medicineQueryParams.push(wardID);
    }

    const [medicineresults] = await pool.query(medicineQuery, medicineQueryParams);
    // Combine results
    results = patientresults[0];
    results.medicineAlerts = medicineresults[0]?.medicineAlerts || 0;

    return results;
  } catch (err) {
    console.error("Error in getnursedashboardcounts:", err.message);
    throw new Error(err.message);
  }
}

async function addleaves(hospitalID, approvedBy, leavesdata) {
  try {
    const { userID, fromDate, toDate, leaveType } = leavesdata || {};

    // Validate input data
    if (!hospitalID || !userID || !fromDate || !toDate || !leaveType) {
      throw new Error(
        "Missing required fields: hospitalID, userID, fromDate, toDate, and leaveType must all be provided"
      );
    }

    const [results] = await pool.query(addstaffLeavesquery, [
      hospitalID,
      approvedBy,
      userID,
      fromDate,
      toDate,
      leaveType,
    ]);
    return results[0];
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getstaffleaves(hospitalID, userID) {
  try {
    const [results] = await pool.query(getstaffleavesQuery, [
      userID,
      hospitalID,
    ]);
    return results;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getstaffleavesCount(hospitalID, userID) {
  try {
    const currentYear = new Date().getFullYear();
    const [results] = await pool.query(getstaffleavesCountQuery, [
      currentYear,
      currentYear,
      hospitalID,
      userID,
      currentYear,
    ]);
    return results[0];
  } catch (err) {
    throw new Error(err.message);
  }
}

async function deletestaffleave(hospitalID, rowId) {
  try {
    if (!hospitalID || !rowId) {
      throw new Error("Hospital ID and Row ID are required");
    }

    // Check if the row exists and get its `addedOn` timestamp
    const [rows] = await pool.query(
      `SELECT addedOn 
       FROM staffLeaves 
       WHERE id = ? AND hospitalID = ?`,
      [rowId, hospitalID]
    );

    if (!rows || rows.length === 0) {
      throw new Error("Staff leave record not found");
    }

    // Convert addedOn to IST (UTC + 5:30)
    const addedOnUTC = new Date(rows[0].addedOn);
    const addedOn = new Date(addedOnUTC.getTime() + 5.5 * 60 * 60 * 1000); // Add 5 hours 30 minutes

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

    // Check if the record is too old to delete
    if (addedOn < oneHourAgo) {
      throw new Error("Cannot delete: Record is older than 1 hour");
    }

    // Define and execute delete query
    const deleteQuery = `
      DELETE FROM staffLeaves 
      WHERE id = ? AND hospitalID = ?
    `;
    const [results] = await pool.query(deleteQuery, [rowId, hospitalID]);

    if (results.affectedRows === 0) {
      throw new Error("Deletion failed: No records affected");
    }

    return {
      success: true,
      message: "Staff leave deleted successfully",
      affectedRows: results.affectedRows,
    };
  } catch (err) {
    console.error("Error in deleteStaffLeave:", err.message);
    throw new Error(err.message || "Failed to delete staff leave");
  }
}

async function getAttendanceLogs(hospitalID, userID) {
  try {
    const [results] = await pool.query(getAttendanceLogsquery, [
      hospitalID,
      userID,
    ]);
    return results[0];
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getnursepatients(hospitalID, userID, role) {
  try {
    let results;
    let departmentID, pTypes
    let wardID = null; // Initialize wardID
    const today = new Date().toISOString().split("T")[0];
    if (role == ROLES_LIST.headNurse) {
      ({ departmentID, pTypes } = await getUserScopes(userID));
    }
    else if (Number(role) === ROLES_LIST.nurse) {
      const [schedules] = await pool.query(
        `SELECT * FROM staffSchedules 
     WHERE userID = ? AND hospitalID = ? AND ? BETWEEN fromDate AND toDate 
     ORDER BY id DESC
     LIMIT 1`,
        [userID, hospitalID, today]
      );
      if (!schedules.length) throw new Error("No schedule assigned");
      const schedule = schedules[0];
      departmentID = schedule.departmentID;
      pTypes = schedule.scope === 2 ? 1 : 2;

      if (schedule.scope !== 2) {
        wardID = schedule.wardID; // Set wardID for scope 1
      }
    }

    let queryParams = [departmentID, pTypes, departmentID, pTypes, hospitalID];
    let query = getheadnursepatientsquery;

    if (wardID) {
      query = `
          ${getheadnursepatientsquery}
          AND pt.wardID = ?
        `;
      queryParams.push(wardID);
    }
    // Fetch dashboard counts with pType filter
    const [patientresults] = await pool.query(query, queryParams);

    results = patientresults;
    return results;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getpatientsmedicationalerts(hospitalID, userID, role) {
  try {
    let medicationAlerts = [];
    let medicationMissedAlerts = [];

    if (role == ROLES_LIST.headNurse) {
      const { departmentID, pTypes } = await getUserScopes(userID);

      const [medresults] = await pool.query(medicationAlertsQuery, [
        hospitalID,
        departmentID,
        pTypes,
      ]);

      const parseMedicationTime = (medTime, baseDate) => {
        const [timeRange] = medTime.split("(");
        const [startStr, endStr] = timeRange.split("-").map((s) => s.trim());

        const startTime = new Date(`${baseDate.toDateString()} ${startStr}`);
        const endTime = new Date(`${baseDate.toDateString()} ${endStr}`);

        return { startTime, endTime, description: medTime };
      };

      // Get current time in IST (Asia/Kolkata)
      const currentTime = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      });
      const now = new Date(currentTime);

      medicationAlerts = medresults;

      medicationMissedAlerts = medresults.filter((result) => {
        const dosageTime = new Date(result.dosageTimes);
        const baseDate = new Date(dosageTime);
        baseDate.setHours(0, 0, 0, 0);

        const medicationTimes = result.medicationTime
          .split(",")
          .map((time) => time.trim());

        // Return true if any slot is missed
        return medicationTimes.some((medTime) => {
          const { startTime, endTime } = parseMedicationTime(medTime, baseDate);

          const isOutsideWindow =
            dosageTime < startTime || dosageTime > endTime;
          const isPastSlot = now > endTime;
          return isOutsideWindow && isPastSlot;
        });
      });
    } else {
      // Nurse alerts placeholder
    }

    return {
      medicationAlerts,
      medicationMissedAlerts,
    };
  } catch (err) {
    throw new Error(`Error fetching medication alerts: ${err.message}`);
  }
}

async function addshiftschedule(
  hospitalID,
  addedBy,
  data,
  existingScheduleID = null
) {
  try {
    // Validate input data with Joi schema
    const result = await staffSchedulesSchema.validateAsync(data);
    const {
      userID,
      departmentID,
      wardID,
      fromDate,
      toDate,
      shiftTimings,
      scope,
    } = result || {};

    if (
      !hospitalID ||
      !userID ||
      !departmentID ||
      !fromDate ||
      !toDate ||
      !shiftTimings ||
      !scope ||
      !addedBy
    ) {
      throw new Error(
        "Missing required fields: hospitalID, userID, departmentID,  fromDate, toDate, shiftTimings, scope, and addedBy must all be provided"
      );
    }

    // Normalize dates to YYYY-MM-DD
    const newFromDate = new Date(fromDate);
    newFromDate.setUTCHours(0, 0, 0, 0);
    const newToDate = new Date(toDate);
    newToDate.setUTCHours(0, 0, 0, 0);

    const fromDateStr = newFromDate.toISOString().split("T")[0]; //ex  "2025-03-25"
    const toDateStr = newToDate.toISOString().split("T")[0]; // ex "2025-04-28"

    // Check for duplicates
    const [duplicateRows] = await pool.query(
      `SELECT id FROM staffSchedules 
       WHERE hospitalID = ? 
         AND userID = ? 
         AND departmentID = ? 
         AND wardID = ? 
         AND fromDate = ? 
         AND toDate = ?`,
      [hospitalID, userID, departmentID, wardID, fromDateStr, toDateStr]
    );

    if (duplicateRows.length > 0) {
      throw new Error(
        "A schedule with the same fromDate and toDate already exists for this user, hospital, department, and ward"
      );
    }

    if (existingScheduleID) {
      const [existingRows] = await pool.query(
        "SELECT toDate FROM staffSchedules WHERE id = ? AND hospitalID = ?",
        [existingScheduleID, hospitalID]
      );

      if (!existingRows.length) {
        throw new Error("Referenced existing schedule not found");
      }

      const rawToDate = existingRows[0].toDate;
      if (!rawToDate) {
        throw new Error("toDate is null or missing in the existing schedule");
      }

      const previousToDate = new Date(rawToDate);
      if (isNaN(previousToDate.getTime())) {
        throw new Error("Invalid toDate value from database: " + rawToDate);
      }
      previousToDate.setUTCHours(0, 0, 0, 0);

      // Update existing row’s toDate to fromDate - 1 day
      const updatedToDate = new Date(newFromDate);
      updatedToDate.setUTCDate(updatedToDate.getUTCDate() - 1);
      const updatedToDateStr = updatedToDate.toISOString().split("T")[0];

      await pool.query(
        "UPDATE staffSchedules SET toDate = ?, updatedOn = CURRENT_TIMESTAMP WHERE id = ? AND hospitalID = ?",
        [updatedToDateStr, existingScheduleID, hospitalID]
      );
    }

    // Insert new row
    const [results] = await pool.query(addshiftschedulequery, [
      hospitalID,
      userID,
      departmentID,
      wardID,
      fromDateStr, // Store as YYYY-MM-DD
      toDateStr, // Store as YYYY-MM-DD
      shiftTimings,
      scope,
      addedBy,
    ]);

    return {
      message: existingScheduleID
        ? "New schedule created as an edit of existing schedule, previous schedule updated"
        : "Shift schedule added successfully",
      insertedId: results.insertId,
    };
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getshiftschedule(hospitalID, userID) {
  try {
    const [results] = await pool.query(getshiftscheduleQuery, [
      userID,
      hospitalID,
    ]);
    return results;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function deleteshiftschedule(hospitalID, rowId) {
  try {
    // First, check if the row exists and its `addedOn` is within 1 hour
    const [rows] = await pool.query(
      `SELECT addedOn FROM staffSchedules WHERE id = ?  AND hospitalID = ?`,
      [rowId, hospitalID]
    );

    if (rows.length === 0) {
      throw new Error("Row not found.");
    }

    // Convert addedOn to IST (UTC + 5:30)
    const addedOnUTC = new Date(rows[0].addedOn);
    const addedOn = new Date(addedOnUTC.getTime() + 5.5 * 60 * 60 * 1000); // Add 5 hours 30 minutes

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

    // Check if the record is too old to delete
    if (addedOn < oneHourAgo) {
      throw new Error("Cannot delete: Record is older than 1 hour");
    }

    // If within 1 hour, proceed with deletion
    const [results] = await pool.query(deletestaffhiftSchedulQuery, [
      rowId,
      hospitalID,
    ]);

    return results;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getmyshiftschedule(hospitalID, userID) {
  try {
    const [results] = await pool.query(getmyshiftscheduleQuery, [
      hospitalID,
      userID,
    ]);
    return results;
  } catch (err) {
    throw new Error(err.message);
  }
}


const getNurseAlerts = async (hospitalID, role, userID) => {

  try {
    let departmentID, pTypes
    let wardID = null; // Initialize wardID
    const today = new Date().toISOString().split("T")[0];

    if (Number(role) === ROLES_LIST.headNurse) {
      ({ departmentID, pTypes } = await getUserScopes(userID));
    } else if (Number(role) === ROLES_LIST.nurse) {
      const [schedules] = await pool.query(
        `SELECT * FROM staffSchedules 
     WHERE userID = ? AND hospitalID = ? AND ? BETWEEN fromDate AND toDate 
     ORDER BY id DESC
     LIMIT 1`,
        [userID, hospitalID, today]
      );
      if (!schedules.length) throw new Error("No schedule assigned");
      const schedule = schedules[0];
      departmentID = schedule.departmentID;
      pTypes = schedule.scope === 2 ? 1 : 2;

      if (schedule.scope !== 2) {
        wardID = schedule.wardID; // Set wardID for scope 1
      }
    }


    let queryGetHospitalAlerts = `WITH LatestAlerts AS (
  SELECT va.id,
         va.timeLineID,
         va.alertType,
         va.alertMessage,
         va.ward,
         va.priority,
         va.datetime,
         va.alertValue,
         va.addedOn,
         va.seen,
         ROW_NUMBER() OVER (PARTITION BY va.timeLineID ORDER BY va.datetime DESC) AS rn
  FROM vitalAlerts va
  LEFT JOIN patientTimeLine plt ON va.timeLineID = plt.id
  LEFT JOIN patients pt ON plt.patientID = pt.id
  WHERE plt.hospitalID = ?
    AND va.datetime >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
   AND plt.departmentID= ?
      AND pt.ptype IN (?)
   `;

    let queryParams = [hospitalID, departmentID, pTypes];

    if (wardID) {
      queryGetHospitalAlerts += ` AND plt.wardID = ?`;
      queryParams.push(wardID);
    }

    queryGetHospitalAlerts += `
)
SELECT la.id,
       pt.id AS patientID,
       pt.pName AS patientName,
       CONCAT(u.firstName, ' ', u.lastName) AS doctorName,
       la.alertType,
       la.alertMessage,
       la.ward,
       la.priority,
       la.datetime,
       la.alertValue,
       la.addedOn,
       la.seen
FROM LatestAlerts la
LEFT JOIN patientTimeLine plt ON la.timeLineID = plt.id
LEFT JOIN patients pt ON pt.id = plt.patientID
LEFT JOIN users u ON u.id = plt.patientID
WHERE la.rn = 1
ORDER BY la.addedOn DESC`;

    const [results] = await pool.query(queryGetHospitalAlerts, queryParams);
    // Remove commas from alert messages
    results.forEach((alert) => {
      if (alert.alertMessage) {
        alert.alertMessage = alert.alertMessage.replace(",", ""); // Replace comma with empty space
      }
    });

    const HighPriorityData = results?.filter(
      (each) => each.priority === "High"
    );
    const MediumPriorityData = results?.filter(
      (each) => each.priority === "Medium"
    );
    const LowPriorityData = results?.filter((each) => each.priority === "Low");
    return {
      message: "success",
      alerts: results,
      HighPriorityData,
      MediumPriorityData,
      LowPriorityData
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

//pending
const nurseHandshake = async (hospitalID,
  timelineID,
  handshakingBy,
  handshakingFrom,
  handshakingTo,
  reason,
  role) => {
  try {

    let [result] = await connection.query(queryCheckPatientTimeLinePresent, [
      timelineID,
      hospitalID
    ]);
    if (result.length === 0) {
      return { status: 403, message: "Timeline not found" };
    }

    if (role === ROLES_LIST.nurse) {
      if (handshakingBy == handshakingTo)
        return {
          status: 401,
          message: "Handshake to the same ward is not allowed"
        };
      // need to check that ward under

      const queryUpdateWardStatusById = `UPDATE patientTimeLine SET wardID = ? WHERE id = ?  AND hospitalID = ? AND patientEndStatus IS NULL`
      const [updateResult] = await connection.query(queryUpdateWardStatusById, [
        handshakingTo,
        timelineID,
        hospitalID
      ]);
      if (updateResult.affectedRows === 0) {
        return {
          status: 400,
          message: "Ward update failed. Possibly already discharged or invalid data."
        };
      }

      return {
        status: 200,
        message: "Successfully handshaked"
      };
    }

  } catch (err) {
    throw new Error(err.message);
  }

}
module.exports = {
  getAllHeadNurseFromHospital,
  getnursedashboardcounts,
  addleaves,
  getAttendanceLogs,
  getnursepatients,
  getpatientsmedicationalerts,
  getHeadNurseAllNurseFromHospital,
  addshiftschedule,
  getmyshiftschedule,
  getstaffleaves,
  getshiftschedule,
  deletestaffleave,
  deleteshiftschedule,
  getNurseAlerts,
  getstaffleavesCount,
  nurseHandshake
};
