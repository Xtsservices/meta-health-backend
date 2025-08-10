const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord,
  notAllowed,
} = require("../utils/errors");
const pool = require("../db/conn");
const dayjs = require("dayjs");

const { findUserByID } = require("../queries/userQueries");
const { getUserHospitalIds } = require("../utils/customareCare");
const { CLOSING } = require("ws");

const queryGetVitalAlerts = `SELECT * FROM vitalAlerts WHERE timeLineID=?`;

const getAllVitalAlertsByhospitalsquery = `
SELECT 
  va.id,
  pt.id AS patientID,
  pt.pName AS patientName,
  pt.state,
  pt.city,
  CONCAT(u.firstName, ' ', u.lastName) AS doctorName,
  pd.hospitalID AS hospitalID,
  va.alertType,
  va.alertMessage,
  va.ward,
  va.priority,
  CONVERT_TZ(va.datetime, '+00:00', '+05:30') AS datetime,
  va.alertValue,
  CONVERT_TZ(va.addedOn, '+00:00', '+05:30') AS addedOn,
  va.seen
FROM vitalAlerts va
LEFT JOIN patientTimeLine plt ON va.timeLineID = plt.id
LEFT JOIN patientDoctors pd ON va.timeLineID = pd.patientTimeLineID AND pd.active = 1
LEFT JOIN patients pt ON pt.id = plt.patientID
LEFT JOIN users u ON u.id = pd.doctorID
WHERE plt.hospitalID IN (?)
  AND pt.ptype != 21
  AND CONVERT_TZ(va.datetime, '+00:00', '+05:30') >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY va.addedOn DESC;
`;

const queryGetHospitalAlerts = `SELECT 
  va.id,
  pt.id AS patientID,
  pt.pName AS patientName,
  CONCAT(u.firstName, ' ', u.lastName) AS doctorName,
  va.alertType,
  va.alertMessage,
  va.ward,
  va.priority,
  va.datetime,
  va.alertValue,
  va.addedOn,
  va.seen
FROM vitalAlerts va
LEFT JOIN patientTimeLine plt ON va.timeLineID = plt.id
LEFT JOIN patientDoctors pd ON va.timeLineID = pd.patientTimeLineID AND pd.active = 1
LEFT JOIN patients pt ON pt.id = plt.patientID
LEFT JOIN users u ON u.id = plt.patientID
WHERE plt.hospitalID = ?
  AND va.datetime >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
  AND pd.doctorID = ?
ORDER BY va.addedOn DESC;
`;

const queryUpdateSeenStatus = `UPDATE vitalAlerts SET seen=? WHERE timeLineID = ?`;


const queryGetNotificationCount = `select medicineReminders 
    LEFT JOIN medicines ON medicines.id=medicineReminders.medicineID
    LEFT JOIN patientTimeLine ON medicines.timeLineID=patientTimeLine.id
    where medicines.timeLineID=? AND
    medicineReminders.dosageTime>?`;

// Query to get latest vital alerts for patients in specified hospitals
const getIndividualAlertsqueryGetVitalAlerts = `
WITH LatestAlerts AS (
  SELECT 
    va.id,
    va.patientID,
    va.vitalsID,
    va.value,
    va.message,
    v.givenTime,
    va.seen,
    va.priority,
    u.state,
    u.city,
    u.address,
    ROW_NUMBER() OVER (PARTITION BY va.patientID ORDER BY v.givenTime DESC) AS rn
  FROM vitalsAlerts va
  LEFT JOIN vitals v ON va.vitalsID = v.readingID
  LEFT JOIN patients p ON va.patientID = p.id
  LEFT JOIN users u ON p.addedBy = u.id
  WHERE u.role = 'patient'
    AND u.hospitalID IN (?)
    AND p.isDelete = 0
    AND v.givenTime >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
)

SELECT 
  la.id,
  la.patientID,
  p.pName AS patientName,
  la.vitalsID,
  la.value AS alertValue,
  la.message AS alertMessage,
  la.givenTime AS addedOn,
  la.seen,
  la.priority,
  la.state,
  la.city,
  la.address
FROM LatestAlerts la
LEFT JOIN patients p ON la.patientID = p.id
WHERE la.rn = 1
ORDER BY la.givenTime DESC;
`;

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET ALL VITALALERTS
 */

const getVitalAlerts = async (req, res) => {
  // const hospitalID = req.params.hospitalID;
  const timeLineID = req.params.timeLineID;

  try {
    const [results] = await pool.query(queryGetVitalAlerts, [timeLineID]);

    res.status(200).send({
      message: "success",
      alerts: results,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getHospitalAlerts = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const userID = req.userID;

  try {
    const [results] = await pool.query(queryGetHospitalAlerts, [
      hospitalID,
      userID,
    ]);

    // Clean alert messages
    results.forEach((alert) => {
      if (alert.alertMessage) {
        alert.alertMessage = alert.alertMessage.replace(/,/g, ""); // Remove all commas
      }
    });


    // Filter latest alerts by priority
    const HighPriorityData = results.filter(
      (each) => each.priority === "High" && each.seen === 0
    );
    const MediumPriorityData = results.filter(
      (each) => each.priority === "Medium" && each.seen === 0
    );
    const LowPriorityData = results.filter(
      (each) => each.priority === "Low" && each.seen === 0
    );

    res.status(200).send({
      message: "success",
      alerts: results, // all alerts
      HighPriorityData, // latest per patient
      MediumPriorityData,
      LowPriorityData,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};



const getcceAlertsStatsHospital = async (req, res) => {
  const userID = req.userID;
  const { year = new Date().getFullYear(), month } = req.params;

  try {
    const hospitalIds = await getUserHospitalIds(pool, findUserByID, userID);

    if (hospitalIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        year,
        month: !month || month === "all" ? "all" : month,
      });
    }

    const currentYear = dayjs().year();
    const selectedYear = parseInt(year) || currentYear;
    const selectedMonth = month;

    let sqlQuery = '';
    const values = [];

    if (!selectedMonth || selectedMonth.toLowerCase() === 'all') {
      // Monthly summary for the selected year
      sqlQuery = `
        WITH TotalAlerts AS (
          SELECT 
            YEAR(va.addedOn) AS year,
            MONTH(va.addedOn) AS period,
            COUNT(*) AS total_alerts
          FROM vitalAlerts va
          LEFT JOIN patientTimeLine plt ON va.timeLineID = plt.id
          LEFT JOIN patientDoctors pd ON va.timeLineID = pd.patientTimeLineID AND pd.active = 1
          LEFT JOIN patients pt ON pt.id = plt.patientID
          WHERE plt.hospitalID IN (?)
            AND pt.ptype != 21
            AND YEAR(va.addedOn) = ?
          GROUP BY YEAR(va.addedOn), MONTH(va.addedOn)
        ),
        ViewedAlerts AS (
          SELECT 
            YEAR(va.addedOn) AS year,
            MONTH(va.addedOn) AS period,
            COUNT(*) AS viewed_alerts
          FROM vitalAlerts va
          LEFT JOIN patientTimeLine plt ON va.timeLineID = plt.id
          LEFT JOIN patientDoctors pd ON va.timeLineID = pd.patientTimeLineID AND pd.active = 1
          LEFT JOIN patients pt ON pt.id = plt.patientID
          WHERE plt.hospitalID IN (?)
            AND pt.ptype != 21
            AND YEAR(va.addedOn) = ?
            AND va.seen = 1
          GROUP BY YEAR(va.addedOn), MONTH(va.addedOn)
        )
        SELECT 
          t.year,
          t.period,
          t.total_alerts,
          COALESCE(v.viewed_alerts, 0) AS viewed_alerts
        FROM TotalAlerts t
        LEFT JOIN ViewedAlerts v ON t.year = v.year AND t.period = v.period
        ORDER BY t.period;
      `;

      values.push(hospitalIds, selectedYear, hospitalIds, selectedYear);

    } else {
      // Daily summary for selected year & month
      const startDate = `${selectedYear}-${selectedMonth.padStart(2, '0')}-01`;
      const endDate = dayjs(startDate).endOf('month').format('YYYY-MM-DD') + ' 23:59:59';

      sqlQuery = `
        WITH TotalAlerts AS (
          SELECT 
            YEAR(va.addedOn) AS year,
            DAY(va.addedOn) AS period,
            COUNT(*) AS total_alerts
          FROM vitalAlerts va
          LEFT JOIN patientTimeLine plt ON va.timeLineID = plt.id
          LEFT JOIN patientDoctors pd ON va.timeLineID = pd.patientTimeLineID AND pd.active = 1
          LEFT JOIN patients pt ON pt.id = plt.patientID
          WHERE plt.hospitalID IN (?)
            AND pt.ptype != 21
            AND va.addedOn BETWEEN ? AND ?
          GROUP BY YEAR(va.addedOn), DAY(va.addedOn)
        ),
        ViewedAlerts AS (
          SELECT 
            YEAR(va.addedOn) AS year,
            DAY(va.addedOn) AS period,
            COUNT(*) AS viewed_alerts
          FROM vitalAlerts va
          LEFT JOIN patientTimeLine plt ON va.timeLineID = plt.id
          LEFT JOIN patients pt ON pt.id = plt.patientID
          WHERE plt.hospitalID IN (?)
            AND pt.ptype != 21
            AND va.addedOn BETWEEN ? AND ?
            AND va.seen = 1
          GROUP BY YEAR(va.addedOn), DAY(va.addedOn)
        )
        SELECT 
          t.year,
          t.period,
          t.total_alerts,
          COALESCE(v.viewed_alerts, 0) AS viewed_alerts
        FROM TotalAlerts t
        LEFT JOIN ViewedAlerts v ON t.year = v.year AND t.period = v.period
        ORDER BY t.period;
      `;
      values.push(hospitalIds, startDate, endDate, hospitalIds, startDate, endDate);
    }

    const [results] = await pool.query(sqlQuery, values);
   

    // Format response for line graph
    const formattedResults = results.map((row) => ({
      period: !selectedMonth || selectedMonth.toLowerCase() === 'all'
        ? new Date(selectedYear, row.period - 1, 1).toLocaleString('en-US', { month: 'short' })
        : row.period,
      total_alerts: row.total_alerts,
      viewed_alerts: row.viewed_alerts,
    }));

    res.json({
      success: true,
      data: formattedResults,
      year: selectedYear,
      month: !selectedMonth || selectedMonth.toLowerCase() === 'all' ? 'all' : selectedMonth,
    });

  } catch (err) {
    console.error("Error in getcceAlertsStatsHospital:", err.message);
    serverError(res, err.message);
  }
};


const getAllVitalAlertsByhospitals = async (req, res) => {
  const userID = req.userID;
  try {
    const hospitalIds = await getUserHospitalIds(pool, findUserByID, userID);
    if (hospitalIds.length === 0) {
      return res.status(200).send({
        message: "success",
        alerts: [],
        HighPriorityData: [],
        MediumPriorityData: [],
        LowPriorityData: [],
      });
    }

    const [results] = await pool.query(getAllVitalAlertsByhospitalsquery, [
      hospitalIds,
    ]);

    // Clean alert messages
    results.forEach((alert) => {
      if (alert.alertMessage) {
        alert.alertMessage = alert.alertMessage.replace(/,/g, ""); // remove commas
      }
    });

  

    // Filter latest alerts by priority
    const HighPriorityData = results.filter(
      (each) => each.priority === "High" && each.seen === 0
    );
    const MediumPriorityData = results.filter(
      (each) => each.priority === "Medium" && each.seen === 0
    );
    const LowPriorityData = results.filter(
      (each) => each.priority === "Low" && each.seen === 0
    );



    res.status(200).send({
      message: "success",
      alerts: results, // all alerts
      HighPriorityData, 
      MediumPriorityData,
      LowPriorityData,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};


const getccedashboardalertcount = async (req, res) => {
  const userID = req.userID;

  try {
    const hospitalIds = await getUserHospitalIds(pool, findUserByID, userID);
    // Fetch  multiState, and multiDist from hospital.users
    const [user] = await pool.query(
      `SELECT  multiState, multiDist FROM hospital.users WHERE id = ?`,
      [userID]
    );

    if (hospitalIds.length === 0) {
      return res.status(200).send({
        message: "success",
        individualAlerts: {
          total: 0,
          active: 0,
          watched: 0,
          highPriority: {
            total: 0,
            viewed: 0,
          },
          mediumPriority: {
            total: 0,
            viewed: 0,
          },
          lowPriority: {
            total: 0,
            viewed: 0,
          },
        },
        hospitalAlerts: {
          total: 0,
          active: 0,
          watched: 0,
          highPriority: {
            total: 0,
            viewed: 0,
          },
          mediumPriority: {
            total: 0,
            viewed: 0,
          },
          lowPriority: {
            total: 0,
            viewed: 0,
          },
        },
      });
    }

    const [hospitalResults] = await pool.query(
      getAllVitalAlertsByhospitalsquery,
      [hospitalIds]
    );

     // Parse multiState and multiDist JSON fields
     let multiState = user[0].multiState ? user[0].multiState : null;
     let multiDist = user[0].multiDist ? user[0].multiDist : null;

     let queryParams = [hospitalIds];
     let homecareFilter = "";
 
     // Build filter for homecarepatient role
     if (multiState && Array.isArray(multiState) && multiState.length > 0 && multiState[0] !== 'all') {
       homecareFilter += ` AND u.state IN (${multiState.map(() => "?").join(", ")})`;
       queryParams.push(...multiState);
     }
     if (multiDist && Array.isArray(multiDist) && multiDist.length > 0 && multiDist[0] !== 'all') {
       homecareFilter += ` AND u.city IN (${multiDist.map(() => "?").join(", ")})`;
       queryParams.push(...multiDist);
     }

    // Updated query for individual patients (removed LatestAlerts CTE)
    const getIndividualAlertsquery = `
      SELECT 
        va.id,
        va.patientID,
        va.vitalsID,
        va.value,
        va.message,
        va.addedOn,
        va.seen,
        va.priority,
        u.state,
        u.city,
        u.address
      FROM vitalsAlerts va
      LEFT JOIN patients p ON va.patientID = p.id
      LEFT JOIN users u ON p.addedBy = u.id
     WHERE (
        (u.role = 'patient' AND u.hospitalID IN (?))
        OR
        (u.role = 'homecarepatient' ${homecareFilter})
      )
        AND p.isDelete = 0
        AND va.addedOn >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY va.addedOn DESC
    `;


    // Hospital alerts (unchanged)

    const hospitalActiveAlerts = hospitalResults.filter(
      (each) => each.seen === 0
    );
    const hospitalWatchedAlerts = hospitalResults.filter(
      (each) => each.seen === 1
    );
    const totalHospitalAlerts = hospitalResults.length;
    const totalHospitalActiveAlerts = hospitalActiveAlerts.length;
    const totalHospitalWatchedAlerts = hospitalWatchedAlerts.length;

    const hospitalHighPriority = hospitalResults.filter(
      (each) => each.priority === "High"
    );
    const hospitalMediumPriority = hospitalResults.filter(
      (each) => each.priority === "Medium"
    );
    const hospitalLowPriority = hospitalResults.filter(
      (each) => each.priority === "Low"
    );
    const hospitalHighPriorityViewed = hospitalHighPriority.filter(
      (each) => each.seen === 1
    );
    const hospitalMediumPriorityViewed = hospitalMediumPriority.filter(
      (each) => each.seen === 1
    );
    const hospitalLowPriorityViewed = hospitalLowPriority.filter(
      (each) => each.seen === 1
    );

   
    
   

    res.status(200).send({
      message: "success",
      individualAlerts: {
        total: 0,
        active: 0,
        watched: 0,
        highPriority: {
          total: 0,
          viewed: 0,
        },
        mediumPriority: {
          total: 0,
          viewed: 0,
        },
        lowPriority: {
          total: 0,
          viewed: 0,
        },
      },
      hospitalAlerts: {
        total: totalHospitalAlerts,
        active: totalHospitalActiveAlerts,
        watched: totalHospitalWatchedAlerts,
        highPriority: {
          total: hospitalHighPriority.length,
          viewed: hospitalHighPriorityViewed.length,
        },
        mediumPriority: {
          total: hospitalMediumPriority.length,
          viewed: hospitalMediumPriorityViewed.length,
        },
        lowPriority: {
          total: hospitalLowPriority.length,
          viewed: hospitalLowPriorityViewed.length,
        },
      },
    });
  } catch (err) {
    console.error("Error in getccedashboardalertcount:", err.message);
    serverError(res, err.message);
  }
};

const getIndividualAlerts = async (req, res) => {
  try {
    const userID = req.userID; // Set by authentication middleware (e.g., verifyJWT)
    const hospitalIds = await getUserHospitalIds(pool, findUserByID, userID);

    // const hospitalIds = user[0].hospitalids; // e.g., [178, 180]
    if (
      !hospitalIds ||
      !Array.isArray(hospitalIds) ||
      hospitalIds.length === 0
    ) {
      return missingBody(res, "No hospital IDs associated with user");
    }

    // Fetch hospitalIds, multiState, and multiDist from hospital.users
    const [user] = await pool.query(
      `SELECT  multiState, multiDist FROM users WHERE id = ?`,
      [userID]
    );

     // Parse multiState and multiDist JSON fields
     let multiState = user[0].multiState ? user[0].multiState : null;
     let multiDist = user[0].multiDist ? user[0].multiDist : null;
 
// Prepare query parameters
let queryParams = [hospitalIds]; // Start with hospitalIds for 'patient' role
let homecareFilter = "";

// Build filter for homecarepatient role
if (multiState && Array.isArray(multiState) && multiState.length > 0 && multiState[0] !== 'all') {
  homecareFilter += ` AND u.state IN (${multiState.map(() => "?").join(", ")})`;
  queryParams.push(...multiState);
}
if (multiDist && Array.isArray(multiDist) && multiDist.length > 0 && multiDist[0] !== 'all') {
  homecareFilter += ` AND u.city IN (${multiDist.map(() => "?").join(", ")})`;
  queryParams.push(...multiDist);
}


// Updated query with role-based filtering
const query = `
SELECT 
  va.id,
  va.patientID,
  p.pName AS patientName,
  va.vitalsID,
  va.value AS alertValue,
  va.message AS alertMessage,
  v.givenTime AS addedOn,
  va.seen,
  va.priority,
  u.state,
  u.city,
  u.address
FROM vitalsAlerts va
LEFT JOIN vitals v ON va.vitalsID = v.readingID
LEFT JOIN patients p ON va.patientID = p.id
LEFT JOIN users u ON p.addedBy = u.id
WHERE (
  (u.role = 'patient' AND u.hospitalID IN (?))
  OR
  (u.role = 'homecarepatient' ${homecareFilter})
)
AND p.isDelete = 0
AND v.givenTime >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY v.givenTime DESC;
`;

    return res.status(200).json({
      message: "success",
      alerts: [],
      HighPriorityData:[],
      MediumPriorityData:[],
      LowPriorityData:[],
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const updateIndividualSeenAlerts = async (req, res) => {
  try {
    res.status(200).send({
      message: "success",
    });

  } catch (err) {
    serverError(res, err.message);
  }
};

const getIndividualPatientDetails = async (req, res) => {

  try {
  
    res.status(200).json({
      message: "success",
      data: hospitalResults[0],
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const updateSeenStatus = async (req, res) => {
  const id = req.params.id;

  try {
    const getPatientQuery = 'SELECT * FROM vitalAlerts WHERE id = ?'
    const [patientInforesults] = await pool.query(getPatientQuery, [id]);
    const patientTimeLine = patientInforesults[0].timeLineID
    const [results] = await pool.query(queryUpdateSeenStatus, [1, patientTimeLine]);
    if (!results.changedRows) return serverError(res, "Failed to update");
    res.status(200).send({
      message: "success",
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getAlertCount = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const userID = req.userID;

  try {
    const [results] = await pool.query(queryGetHospitalAlerts, [
      hospitalID,
      userID,
    ]);
    const unseenData = results?.filter(
      (each) => each.seen === 0 && each.priority != ""
    );
    const count = unseenData?.length || 0;
    res.status(200).send({
      message: "success",
      count: count,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getHospitalAlertsByTimeIntervals = async (req, res) => {
  const userID = req.userID;
  const { date } = req.params;

  try {
    const hospitalIds = await getUserHospitalIds(pool, findUserByID, userID);

    if (hospitalIds.length === 0) {
      return res.status(200).send({
        message: "success",
        hospitalAlerts: {
          total: 0,
          timeIntervals: {
            lessThan5Min: { watched: 0 },
            lessThan10Min: { watched: 0 },
            lessThan15Min: { watched: 0 },
            lessThan20Min: { watched: 0 },
            moreThan20Min: { watched: 0 },
          },
        },
      });
    }

    // Query hospital alerts, including addedOn and lastModified
    const getAllVitalAlertsByHospitalsQuery = `
      SELECT 
        va.id,
        va.seen,
        va.addedOn,
        va.lastModified
      FROM vitalAlerts va
      LEFT JOIN patientTimeLine plt ON va.timeLineID = plt.id
      INNER JOIN patientDoctors pd ON va.timeLineID = pd.patientTimeLineID AND pd.active = 1
      WHERE plt.hospitalID IN (?)
        ${
          date && !isNaN(Date.parse(date))
            ? "AND DATE(va.datetime) = DATE(?)"
            : ""
        }
    `;
    const queryParams = [hospitalIds];
    if (date && !isNaN(Date.parse(date))) {
      queryParams.push(new Date(date));
    }

    const [hospitalResults] = await pool.query(
      getAllVitalAlertsByHospitalsQuery,
      queryParams
    );
 

    // Define time intervals
    const timeIntervals = [
      { name: "lessThan5Min", maxMinutes: 5, minMinutes: 0 },
      { name: "lessThan10Min", maxMinutes: 10, minMinutes: 5 },
      { name: "lessThan15Min", maxMinutes: 15, minMinutes: 10 },
      { name: "lessThan20Min", maxMinutes: 20, minMinutes: 15 },
      { name: "moreThan20Min", minMinutes: 20 },
    ];

    const hospitalAlertsCounts = {
      total: hospitalResults.length,
      timeIntervals: {},
    };

    // Initialize watched counts
    timeIntervals.forEach(({ name }) => {
      hospitalAlertsCounts.timeIntervals[name] = { watched: 0 };
    });

    // Assign each seen alert to the smallest applicable interval
    hospitalResults.forEach((alert) => {
      if (alert.seen !== 1) return; // Only count seen alerts
      const addedOn = new Date(alert.addedOn);
      const lastModified = new Date(alert.lastModified || alert.addedOn); // Fallback to addedOn if lastModified is null
      const timeDiff = lastModified - addedOn; // Difference in milliseconds
   

      // Find the appropriate interval where timeDiff fits
      for (const { name, maxMinutes, minMinutes } of timeIntervals) {
        const minMs = minMinutes * 60 * 1000;
        if (name === "moreThan20Min" && timeDiff > minMs) {
          hospitalAlertsCounts.timeIntervals[name].watched += 1;
          break; // Stop after assigning to the interval
        } else if (maxMinutes && timeDiff >= minMs && timeDiff <= maxMinutes * 60 * 1000) {
          hospitalAlertsCounts.timeIntervals[name].watched += 1;
          break; // Stop after assigning to the smallest interval
        }
      }
    });

    res.status(200).send({
      message: "success",
      hospitalAlerts: hospitalAlertsCounts,
    });
  } catch (err) {
    console.error("Error in getHospitalAlertsByTimeIntervals:", err.message);
    serverError(res, err.message);
  }
};



const getIndividualAlertsByTimeIntervals = async (req, res) => {
  try {
    res.status(200).send({
      message: "success",
    });
  } catch (err) {
    console.error("Error in getIndividualAlertsByTimeIntervals:", err.message);
    serverError(res, err.message);
  }
};



const getVitalAlertsByHour = async (req, res) => {
  const { userID } = req;
  const { date } = req.query;

  // Validate date
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).send({
      message: "Invalid or missing date parameter. Use YYYY-MM-DD format.",
    });
  }

  try {
    // Initialize hourly counts
    const hourlyCounts = Array.from({ length: 24 }, (_, i) => ({
      x: `${i.toString().padStart(2, "0")}:00`,
      y: 0,
    }));

    // Get hospital IDs
    const hospitalIds = await getUserHospitalIds(
      pool,
      findUserByID,
      userID
    ).catch((err) => {
      console.error(
        `Error in getUserHospitalIds for userID ${userID}: ${err.message}`
      );
      return [];
    });

    // If no hospital IDs, return zero counts
    if (!hospitalIds.length) {
      console.warn(
        `No hospital IDs found for userID ${userID}, returning zero counts`
      );
      return res.status(200).send({ message: "success", date, hourlyCounts });
    }

    // Updated query with patientDoctors join and active = 1 check
    const alertsQuery = `
      SELECT 
        HOUR(STR_TO_DATE(va.datetime, '%Y-%m-%dT%H:%i:%s.%fZ')) AS hour,
        COUNT(*) AS count
      FROM vitalAlerts va

      LEFT JOIN patientTimeLine pt ON va.timeLineID = pt.id
      INNER JOIN patientDoctors pd ON va.timeLineID = pd.patientTimeLineID AND pd.active = 1

      WHERE pt.hospitalID IN (${hospitalIds.map(() => "?").join(",")})
        AND DATE(STR_TO_DATE(va.datetime, '%Y-%m-%dT%H:%i:%s.%fZ')) = ?
        AND va.datetime IS NOT NULL
        AND STR_TO_DATE(va.datetime, '%Y-%m-%dT%H:%i:%s.%fZ') IS NOT NULL
      GROUP BY HOUR(STR_TO_DATE(va.datetime, '%Y-%m-%dT%H:%i:%s.%fZ'))
      ORDER BY hour
    `;
    const queryParams = [...hospitalIds, date];
    const [alertResults] = await pool.query(alertsQuery, queryParams);

    // Populate counts
    alertResults.forEach(({ hour, count }) => {
      hourlyCounts[parseInt(hour, 10)].y = parseInt(count, 10);
    });

    // Send response
    res.status(200).send({ message: "success", date, hourlyCounts });
  } catch (err) {
    console.error(
      `Error in getVitalAlertsByHour for userID ${userID}, date ${date}:`,
      err
    );
    serverError(res, err.message);
  }
};

const getIndividualAlertsByDateHourly = async (req, res) => {
  

  try {
    res.status(200).send({
      message: "success",
    });
  } catch (err) {
    console.error("Error in getIndividualAlertsByDateHourly:", err.message);
    serverError(res, err.message);
  }
};

const getIndividualAlertsByYearAndMonth = async (req, res) => {
 
  try {
    res.json({
      success: true,
    });
  } catch (err) {
    console.error("Error in getIndividualAlertsByYearAndMonth:", err.message);
    serverError(res, err.message);
  }
};

const getIndividualHomeCarePatientsVitails = async (req, res) => {
  
  try {
    

    res.status(200).json({
      message: "success",
      data: [],
    });
  } catch (err) {
    console.error("Error in getIndividualHomeCarePatientsVitals:", err.message);
    return serverError(res, err.message);
  }
};



module.exports = {
  getcceAlertsStatsHospital,
  getVitalAlerts,
  getHospitalAlerts,
  updateSeenStatus,
  getAlertCount,
  getIndividualAlerts,
  updateIndividualSeenAlerts,
  getAllVitalAlertsByhospitals,
  getIndividualPatientDetails,
  getccedashboardalertcount,
  getHospitalAlertsByTimeIntervals,
  getIndividualAlertsByTimeIntervals,
  getVitalAlertsByHour,
  getIndividualAlertsByDateHourly,
  getIndividualAlertsByYearAndMonth,
  getIndividualHomeCarePatientsVitails
};
