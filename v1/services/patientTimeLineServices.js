const pool = require("../db/conn");
const { patientSchema } = require("../helper/validators/patientValidator");
const {
  queryGetLatestTimeLine,
  queryGetAllTimeLines,
  queryGetAllPatientTimeLine,
  queryGetLatestPatientTimeLine
} = require("../queries/patientTimeLineQueries");

const {
  patientTimeLineSchema
} = require("../helper/validators/patientTimeLineValidator");
const { format } = require("date-fns");

/**
 *** METHOD : GET
 *** DESCRIPTION : get patient by id and join the latest timeline
 ***
 */
const getLatestTimeLineByPatientID = async (patientID) => {
  try {
    const results = await pool.query(queryGetLatestTimeLine, [patientID]);
    // console.log(`result : ${JSON.stringify(results)}`)
    if (!results[0][0]) throw new Error("no timeline found");

    return results[0][0];
  } catch (err) {
    throw new Error(err.message);
  }
};

const getLatestTimeLineByPatienTimelinetID = async (patientID, hospitalID) => {
  try {
    const results = await pool.query(queryGetLatestPatientTimeLine, [
      patientID,
      hospitalID
    ]);
    // console.log(`result : ${JSON.stringify(results)}`)
    if (!results[0][0]) throw new Error("no timeline found");

    return results[0][0];
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * **
 * ** METHOD : GET
 * ** DESCRIPTION : GET ALL PATIENT TIMELINES
 */
const getAllTimeLineOfPatient = async (patientID) => {
  const querysub = `

SELECT
    pt.id AS patientTimeLineID,
    pt.patientID,
    pt.startTime,
    pt.endTime,
    pt.patientStartStatus,
    pt.patientEndStatus,
    pt.diagnosis,
    p.addedOn AS patientAddedOn,
    CONCAT(users.firstName, ' ', users.lastName) AS addedBy,

    -- New: isRevisit (check if any previous timeline had patientEndStatus = 21)
    (
    SELECT CASE 
        WHEN EXISTS (
            SELECT 1
            FROM patientTimeLine pt2
            WHERE pt2.patientID = pt.patientID
            AND pt2.patientEndStatus = 21
            AND pt2.id < pt.id
            AND NOT EXISTS (
                SELECT 1
                FROM patientTimeLine pt3
                WHERE pt3.patientID = pt.patientID
                AND pt3.id < pt.id
                AND pt3.id > pt2.id
            )
            ORDER BY pt2.startTime DESC
            LIMIT 1
        ) THEN TRUE
        ELSE FALSE
    END
) AS isRevisit,

  -- New: isFollowUp (check if followUp=1)
(
    SELECT JSON_OBJECT(
        'patientStartStatus', pt1.patientStartStatus,
        'followUpDate', pt1.followUpDate,
        'followUp', pt1.followUp
    )
    FROM patientTimeLine pt1
    WHERE pt1.followUp = 1 
    AND pt1.id = pt.id
    LIMIT 1 
) AS isFollowUp,


    

    -- Transfer Patient Details (structured JSON array)
   (
    SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'transferType', tp.transferType,
            'reason', tp.reason,
            'transferDate', tp.transferDate,
            'hospitalName', tp.hospitalName,
            'fromDoc', 
                (SELECT CONCAT(u.firstName, ' ', u.lastName)
                 FROM patientDoctors pd
                 JOIN users u ON pd.doctorID = u.id
                 WHERE pd.patientTimeLineID = tp.patientTimeLineID
                 LIMIT 1),  
            'toDoc', 
                (SELECT CONCAT(u.firstName, ' ', u.lastName)
                 FROM patientDoctors pd
                 JOIN users u ON pd.doctorID = u.id
                 WHERE pd.patientTimeLineID = tp.patientNewTimeLineID
                 LIMIT 1),

            -- Fetch transferFromDepartment using patientStartStatus
            'transferFromDepartment', (
                SELECT ptFrom.patientStartStatus
                FROM 
                patientTimeLine as  ptFrom
                WHERE ptFrom.id = tp.patientTimeLineID
                LIMIT 1
            ),

            -- Fetch transferToDepartment using patientEndStatus
            'transferToDepartment', (
                SELECT ptTo.patientStartStatus
                FROM 
                patientTimeLine as  ptTo
                WHERE ptTo.id = tp.patientNewTimeLineID
                LIMIT 1
            ),

            -- Fetch fromWard using patientTimeLineID
            'fromWard', (
                SELECT w.name
                FROM wards w
                JOIN patientTimeLine ptFrom ON ptFrom.id = tp.patientTimeLineID
                WHERE w.id = ptFrom.wardID
                LIMIT 1
            ),

            -- Fetch toWard using patientNewTimeLineID
            'toWard', (
                SELECT w.name
                FROM wards w
                JOIN patientTimeLine ptTo ON ptTo.id = tp.patientNewTimeLineID
                WHERE w.id = ptTo.wardID
                LIMIT 1
            )
        )
    )
    FROM transferPatient tp
    WHERE tp.patientNewTimeLineID = pt.id
) AS transferDetails,

-- external transfer
(
    SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'transferType', tp.transferType,
            'reason', tp.reason,
            'transferDate', tp.transferDate,
            'tohospitalName', tp.hospitalName,
            'fromhospitalName', h.name,
            'fromDoc', 
                (SELECT CONCAT(u.firstName, ' ', u.lastName)
                 FROM patientDoctors pd
                 JOIN users u ON pd.doctorID = u.id
                 WHERE pd.patientTimeLineID = tp.patientTimeLineID
                 LIMIT 1),

            'transferFromDepartment', (
                SELECT ptFrom.patientStartStatus
                FROM patientTimeLine ptFrom
                WHERE ptFrom.id = tp.patientTimeLineID
                LIMIT 1
            ),

            'fromWard', (
                SELECT w.name
                FROM wards w
                JOIN patientTimeLine ptFrom ON ptFrom.id = tp.patientTimeLineID
                WHERE w.id = ptFrom.wardID
                LIMIT 1
            )
        )
    )
    FROM transferPatient tp
    LEFt JOIN hospitals as h ON tp.hospitalID = h.id
    WHERE tp.patientNewTimeLineID IS NULL 

    AND tp.patientTimeLineID = pt.id
) AS externalTransferDetails,


    -- Primary Doctor Assignment (only the first doctor)
    (
        SELECT JSON_OBJECT(
            'assignedDate', pd.assignedDate,
            'lastUpdated', pd.last_updated,
            'purpose', pd.purpose,
            'category', pd.category,
            'active', pd.active,
            'scope', pd.scope,
            'doctorName', CONCAT(u.firstName, ' ', u.lastName)
        )
        FROM patientDoctors pd
        LEFT JOIN users u ON pd.doctorID = u.id
        WHERE pd.patientTimeLineID = pt.id
        ORDER BY pd.assignedDate ASC
        LIMIT 1
    ) AS doctorDetails,

    -- Handshake Doctor Details (only if more than 1 doctor exists for this patientTimeLineID)

    (
    SELECT 
        IF(COUNT(*) >= 1,
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'fromDoc', prev.doctorName,
                    'toDoc', curr.doctorName,
                    'assignedDate', curr.assignedDate,
                    'lastUpdated', curr.last_updated,
                    'purpose', curr.purpose,
                    'category', curr.category,
                    'active', curr.active,
                    'scope', curr.scope
                )
            ),
            NULL
        )
    FROM (
        SELECT 
            pd.id,
            pd.patientTimeLineID,
            pd.doctorID,
            pd.assignedDate,
            pd.last_updated,
            pd.purpose,
            pd.category,
            pd.active,
            pd.scope,
            CONCAT(u.firstName, ' ', u.lastName) AS doctorName,
            ROW_NUMBER() OVER (PARTITION BY pd.patientTimeLineID ORDER BY pd.assignedDate) AS row_num
        FROM patientDoctors pd
        JOIN users u ON pd.doctorID = u.id 
        WHERE pd.patientTimeLineID = pt.id
    ) curr
    JOIN (
        SELECT 
            pd.id,
            pd.patientTimeLineID,
            pd.doctorID,
            pd.assignedDate,
            pd.last_updated,
            pd.purpose,
            pd.category,
            pd.active,
            pd.scope,
            CONCAT(u.firstName, ' ', u.lastName) AS doctorName,
            ROW_NUMBER() OVER (PARTITION BY pd.patientTimeLineID ORDER BY pd.assignedDate) AS row_num
        FROM patientDoctors pd
        JOIN users u ON pd.doctorID = u.id
        WHERE pd.patientTimeLineID = pt.id
    ) prev
    ON curr.row_num = prev.row_num + 1
) AS handshakeDetails,


    -- Operation Theatre Details (structured JSON array)
    (
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', ot.id,
                'status', ot.status,
                'addedOn', ot.addedOn,
                'approvedTime', ot.approvedTime,
                'scheduleTime', ot.scheduleTime,
                'completedTime', ot.completedTime,
                'patientType', ot.patientType,
                'surgeryType', ot.surgeryType,
                'rejectReason', ot.rejectReason,
                'approvedBy' ,  CONCAT(u.firstName, ' ', u.lastName),
                'scope' , pd.scope,
                'rejectedTime',ot.rejectedTime
            )
        )
        FROM operationTheatre ot
        left join patientDoctors as pd ON pd.patientTimeLineID = pt.id AND pd.scope IN('surgon','anesthetic')
        left join users as u ON u.id = pd.doctorID
        WHERE ot.patientTimeLineID = pt.id
    ) AS operationTheatreDetails,

    -- Symptom Details (structured JSON array)
    (
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'symptom', s.symptom,
                'symptomAddedOn', s.addedOn,
                'duration', s.duration,
                'durationParameter', s.durationParameter
            )
        )
        FROM symptoms s
        WHERE s.timeLineID = pt.id
    ) AS symptomsDetails

FROM patientTimeLine AS pt

-- Join with patients to get patientAddedOn
LEFT JOIN patients AS p 
    ON pt.patientID = p.id
Left JOIN users ON p.addedBy = users.id
-- Filter by patientID
WHERE pt.patientID = ?

-- Group by timeline ID
GROUP BY pt.id

-- Order by start time
ORDER BY pt.startTime ASC;




`;

  try {
    //queryGetAllTimeLines
    const results = await pool.query(querysub, [patientID]);
    if (!results[0][0]) throw new Error("no timeline found");
    const data = results[0];
    console.log("timeLinedata", data);

    return results[0];
  } catch (error) {
    throw new Error(err.message);
  }
};

const getAllTimeLines = async (patientID) => {
  try {
    const result = await pool.query(queryGetAllPatientTimeLine, [patientID]);

    return result[0];
  } catch (err) {
    throw new Error(res, err.message);
  }
};

module.exports = {
  getLatestTimeLineByPatientID,
  getAllTimeLineOfPatient,
  getAllTimeLines,
  getLatestTimeLineByPatienTimelinetID
};
