const pool = require("../db/conn");
const bcrypt = require("bcrypt");
const {
  patientSchema,
  updatePatientSchema,
  dateValidation
} = require("../helper/validators/patientValidator");
const {
  patientTimeLineSchema,
  dischargeSchema,
  updateTimeLineSchema
} = require("../helper/validators/patientTimeLineValidator");
const { format } = require("date-fns");
const patientUtils = require("../utils/patientUtils");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");
const { object, forbidden } = require("joi");
const {
  transferPatientSchema
} = require("../helper/validators/transferPatientValidator");
const ROLES_LIST = require("../utils/roles");
const doctorService = require("../services/doctorService");

const {
  queryFindPatientByPID,
  queryUpdatePatientByID,
  queryUpdatePatientTimeLineByID,
  queryUpdatePatientTimeLineByIDAddWard,
  queryInsertPatient,
  querySetID,
  queryInsertPatientTimeLine,
  queryInsertPatientTimeLineForTransfer,
  queryInsertTransferPatient,
  queryRevisitPatientTimeLine,
  queryGetPatientsByType,
  queryGetPatientsByTypeAndZone,
  queryGetPatientsForTriage,
  queryGetPatientByTypeWithFilter,
  queryGetPatientByTypeAndZoneWithFilter,
  queryGetNotificationCount,
  queryGetDischargedPatients,
  queryGetDischargedAndOutpatients,
  queryGetDischargedPatientsWithFilter,
  queryGetRecentPatientsByType,
  queryCountPatientsByType,
  queryCountAllPatients,
  queryPatientVisitByDate,
  queryCountPatientVisitMonthAndYear,
  queryCountPatientVisitMonthAndYearForEmergency,
  queryGetLatestTimeLine,
  queryGetCountBetweenDates,
  queryUpdatePatient,
  queryUpdatePatientTimeLine,
  queryUpdatePatientTimeLineForTransfer,
  queryGetPatientByID,
  queryGetDepartmentsPercentage,
  queryGetPatientForDischarge,
  queryUpdatePatientRevisit,
  queryCheckDevicePresent,
  queryGetDevice,
  queryGetFullPatientByID,
  queryGetFullPatientByIDForTriage,
  queryGetSummary,
  queryGetPercentageUseOfDevices,
  queryGetCalendarCards,
  querySetFilterOption,
  queryPatientCountWithFilter,
  queryPatientCountWithFilterForEmergency,
  queryDepartmentDistribution,
  queryDecreaseWardBed,
  queryIncreaseWardBed,
  queryInsertFollowUp,
  queryPatientCountForZone
} = require("../queries/patientQueries");

const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const AWS_BUCKET_REGION = process.env.AWS_BUCKET_REGION;
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;

const s3Client = new S3Client({
  region: AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY
  }
});

const generateFileName = (bytes = 16) =>
  crypto.randomBytes(bytes).toString("hex");

function dateFormat(date) {
  return format(date, "yyyy-MM-dd");
}

const checkIfpatientExists = async (pID, hospitalID) => {
  try {
    let status;
    const results = await pool.query(queryFindPatientByPID, [hospitalID, pID]);
    if (results[0].length !== 0) {
      status = 0;
    } else {
      status = 1;
    }
    return status;
  } catch (err) {
    throw new Error(err.message);
  }
};

const getSummary = async (
  duration,
  hospitalID,
  month,
  year,
  filterType,
  categoryFilter
) => {
  const getCurrentMonth = () => new Date().getMonth() + 1;
  const getCurrentYear = () => new Date().getFullYear();
  let connection;

  const getCurrentWeek = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(
      now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)
    ); // Adjust to the start of the week (Sunday)

    const days = Math.floor((now - startOfWeek) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + 1) / 7); // Adding 1 to start the count from 1
  };

  const filterValue = {
    month: month || getCurrentMonth(),
    year: year || getCurrentYear(),
    week: getCurrentWeek()
  }[filterType];
  let filterCondition = "";
  if (filterValue !== undefined) {
    if (filterType === "month") {
      filterCondition = `AND MONTH(startTime) = ${filterValue} AND YEAR(startTime) = YEAR(NOW())`;
    } else if (filterType === "week") {
      filterCondition = `AND YEARWEEK(startTime, 1) = YEARWEEK(NOW(), 1)`;
    } else {
      filterCondition = `AND ${filterType}(startTime) = ${filterValue}`;
    }
  }
  const categoryFilterCondition = categoryFilter
    ? `AND p.category = ${categoryFilter}`
    : "";
  const patientsJoin = categoryFilterCondition
    ? "JOIN patients p ON pt.patientID = p.id"
    : "";
  const query = `
    SELECT
      pt.patientStartStatus,
      COUNT(*) AS patientCount
    FROM
      patientTimeLine pt
    ${patientsJoin}
    WHERE
      pt.hospitalID=?
      ${filterCondition}
      ${categoryFilterCondition}
    GROUP BY
      pt.patientStartStatus
  `;
  const queryForDischarge = `
  SELECT pt.patientEndStatus, COUNT(*) AS patientCount,dischargeType
  FROM patientTimeLine pt 
  ${patientsJoin} 
  WHERE pt.hospitalID=? AND pt.patientEndStatus=${patientUtils.patientStatus.discharged}
  ${filterCondition}
  ${categoryFilterCondition}
  GROUP BY dischargeType
  `;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const result = await connection.query(query, [hospitalID]);
    const dischargeResult = await connection.query(query, [hospitalID]);
    const summary = {};
    result[0].forEach((el) => {
      summary[
        Object.keys(patientUtils.patientStatus)[
          Object.values(patientUtils.patientStatus).indexOf(
            el.patientStartStatus
          )
        ]
      ] = el.patientCount;
    });
    summary[dischargeResult[0].patientEndStatus] =
      dischargeResult[0].patientCount;

    dischargeResult[0].forEach((el) => {
      if (el.dischargeType == patientUtils.dischargeType.death)
        summary.death = el.patientCount;
      else summary.discharged = (summary.discharged || 0) + el.patientCount;
    });

    return summary;
  } catch (err) {
    throw new Error(err.message);
  } finally {
    if (connection) connection.release();
  }
};

const doctorSummary = async (
  filterType,
  hospitalID,
  doctorID,
  year,
  categoryFilter
) => {
  try {
    const getCurrentMonth = () => new Date().getMonth() + 1;
    const getCurrentYear = () => new Date().getFullYear();
    const getCurrentWeek = () => {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(
        now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)
      ); // Adjust to the start of the week (Sunday)

      const days = Math.floor((now - startOfWeek) / (24 * 60 * 60 * 1000));
      return Math.ceil((days + 1) / 7); // Adding 1 to start the count from 1
    };
    const filterValue = {
      month: getCurrentMonth(),
      year: getCurrentYear(),
      week: getCurrentWeek()
    }[filterType];
    let filterCondition = "";
    if (filterValue !== undefined) {
      if (filterType === "month") {
        filterCondition = `AND MONTH(startTime) = MONTH(NOW()) AND YEAR(startTime) = YEAR(NOW())`;
      } else if (filterType === "week") {
        filterCondition = `AND YEARWEEK(startTime, 1) = YEARWEEK(NOW(), 1)`;
      } else {
        filterCondition = `AND ${filterType}(startTime) = ${filterValue}`;
      }
    }
    const categoryFilterCondition = categoryFilter
      ? `AND p.category = ${categoryFilter}`
      : "";
    const patientsJoin = categoryFilterCondition
      ? "JOIN patients p ON pt.patientID = p.id"
      : "";
    const query = `
      SELECT
        patientTimeLine.patientID,
        COUNT(*) AS patientCount,
        MONTH(patientTimeLine.startTime) AS month_year
      FROM
        patientTimeLine
      WHERE
        patientTimeLine.hospitalID=?
        AND patientTimeLine.patientID=?
        AND YEAR(patientTimeLine.startTime) = ${year || "YEAR(CURRENT_DATE)"}
      GROUP BY month_year
      ORDER BY month_year
    `;
    const results = await pool.query(query, [hospitalID, doctorID]);

    // console.log(results[0][0]);
    const summary = [];
    results[0].forEach((el) => {
      summary.push({ filter_value: el.month_year, count: el.patientCount });
      // summary[el.month_year] = el.patientCount;
    });

    return summary;
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET CALENDAR CARDS
 */
const getCalendarCard = async (hospitalId, date) => {
  try {
    await dateValidation.validateAsync({ date });
    const [result] = await pool.query(queryGetCalendarCards, [hospitalId]);
    let totalPatients = 0,
      inPatients = 0,
      discharged = 0;
    if (date) {
      for (let i = 0; i < result.length; i++) {
        if (!result[i].patientEndStatus) {
          inPatients++;
          totalPatients++;
        }
        console.log(`startTime : ${result[i].startTime}`);
        console.log(`endTime: ${result[i].endTime}`);
        if (result[i].endTime > result[i].startTime) {
          const gotDate = result[i].endTime.toISOString().split("T")[0];
          console.log(`endDate: ${gotDate} , date: ${date}`);
          if (gotDate === date) {
            discharged++;
            totalPatients++;
          }
        }
      }
    } else {
      for (let i = 0; i < result.length; i++) {
        if (!result[i].patientEndStatus) {
          inPatients++;
          totalPatients++;
        } else {
          discharged++;
          totalPatients++;
        }
      }
    }

    return {
      totalPatients,
      inPatients,
      discharged,
      result
    };
  } catch (err) {
    if (err.isJoi) throw new Error(`joi:${err.message}`);
    throw new Error(err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET PERCENTAGE USE OF DEVICES
 */
const getPercentageUseOfDevices = async (hospitalID) => {
  try {
    const [result] = await pool.query(queryGetPercentageUseOfDevices, [
      hospitalID
    ]);
    let inPatients = 0;
    let outPatients = 0;
    let emergency = 0;
    result.map((item) => {
      switch (item.patientStartStatus) {
        case 1:
          outPatients++;
          break;
        case 2:
          inPatients++;
          break;
        case 3:
          emergency++;
          break;
      }
    });
    const total = result.length;
    const outPatientPercent = ((outPatients / total) * 100).toFixed(2);
    const intPatientPercent = ((inPatients / total) * 100).toFixed(2);
    const emergencyPercent = ((emergency / total) * 100).toFixed(2);

    return {
      outPatientPercent,
      intPatientPercent,
      emergencyPercent
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET PERCENTAGE USE OF DEVICES
 */
const getPercentageUsageOfHubs = async (hospitalID) => {
  try {
    const [result] = await pool.query(queryGetPercentageUseOfDevices, [
      hospitalID
    ]);
    let inPatients = 0;
    let outPatients = 0;
    let emergency = 0;
    result.map((item) => {
      switch (item.patientStartStatus) {
        case 1:
          outPatients++;
          break;
        case 2:
          inPatients++;
          break;
        case 3:
          emergency++;
          break;
      }
    });
    const total = result.length;
    const outPatientPercent = ((outPatients / total) * 100).toFixed(2);
    const intPatientPercent = ((inPatients / total) * 100).toFixed(2);
    const emergencyPercent = ((emergency / total) * 100).toFixed(2);

    return {
      outPatientPercent,
      intPatientPercent,
      emergencyPercent
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : get list of patients with type= inpatient,outpatient or emergency,discharged
 */
const getAllPatientsByType = async (
  hospitalID,
  ptype,
  role,
  zone,
  userID,
  startStatus
) => {
  try {
    let results;
    if (ptype == patientUtils.patientStatus.discharged) {
      // console.log("discharged patients");
      test = await pool.query(queryGetDischargedPatients(role, startStatus), [
        hospitalID,
        ptype,
        userID
      ]);
      results = test[0];
    } else if (
      ptype
        .split("$")
        .map((el) => Number(el))
        .includes(patientUtils.patientStatus.outpatient)
    ) {
      test = await pool.query(queryGetDischargedAndOutpatients(role), [
        hospitalID,
        ptype.split("$").map((el) => Number(el)),
        userID
      ]);
      results = test[0];
    } else {
      let testRes;
      if (ptype == patientUtils.patientStatus.inpatient) {
        testRes = await pool.query(queryGetPatientsByType(role), [
          hospitalID,
          ptype, ////Make it an array
          userID
        ]);
      } else
        testRes = await pool.query(queryGetPatientsByTypeAndZone(role), [
          hospitalID,
          ptype, ////Make it an array
          zone
        ]);
      // console.log("-----patient list------", testRes[0], role, userID);
      results = await Promise.all(
        testRes[0].map(async (patient) => {
          const date = new Date().toISOString().split("T")[0];
          const ret = await pool.query(queryGetNotificationCount, [
            patient.patientTimeLineID,
            date
          ]);
          // console.log(`count : ${JSON.stringify(ret[0])}`);
          patient.notificationCount = ret[0][0].count;
          return patient;
        })
      );

      // results = testRes[0].map(async (patient) => {
      //     const date = new Date().toISOString().split('T')[0];
      //     const ret = await pool.query(queryGetNotificationCount, [patient.patientTimeLineID, date]);
      //     console.log(`count : ${ret[0].count}`);
      //     patient.notificationCount = ret[0].count;
      //     return patient
      // });

      // await Promise.all(results);
    }

    const patients = results;
    const patientsWithPhotos = await Promise.all(
      patients.map(async (patient) => {
        if (patient.photo) {
          const imageURL = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: patient.photo
            }),
            { expiresIn: 300 }
          );
          patient.imageURL = imageURL;
        }
        patient.doctorName = patient.firstName + " " + patient.lastName;
        return patient;
      })
    );

    console.log(
      "============================patientsWithPhotos=====",
      patientsWithPhotos
    );

    return patientsWithPhotos;
  } catch (err) {
    throw new Error(err.message);
  }
};

const getpatientsForTriage = async (hospitalID, ptype) => {
  try {
    const testRes = await pool.query(queryGetPatientsForTriage, [hospitalID]);

    const patientsWithPhotos = await Promise.all(
      testRes[0].map(async (patient) => {
        if (patient.photo) {
          const imageURL = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: patient.photo
            }),
            { expiresIn: 300 }
          );
          patient.imageURL = imageURL;
        }
        patient.doctorName = patient.firstName + " " + patient.lastName;
        return patient;
      })
    );

    return patientsWithPhotos;
  } catch (err) {
    throw new Error(err.message);
  }
};

const getAllPatientsByTypeWithFilter = async (
  hospitalID,
  ptype,
  departmentID,
  wardID,
  zone
) => {
  try {
    let results;
    if (ptype == patientUtils.patientStatus.discharged) {
      console.log("discharged patients");
      test = await pool.query(queryGetDischargedPatientsWithFilter, [
        hospitalID,
        ptype,
        departmentID,
        departmentID,
        wardID,
        wardID
      ]);
      results = test[0];
    } else {
      // console.log("other patients");
      let testRes;
      if (!ptype == patientUtils.patientStatus.emergency)
        testRes = await pool.query(queryGetPatientByTypeWithFilter, [
          hospitalID,
          ptype,
          departmentID,
          departmentID,
          wardID,
          wardID
        ]);
      else
        testRes = await pool.query(queryGetPatientByTypeAndZoneWithFilter, [
          hospitalID,
          ptype,
          zone
        ]);
      results = await Promise.all(
        testRes[0].map(async (patient) => {
          const date = new Date().toISOString().split("T")[0];
          const ret = await pool.query(queryGetNotificationCount, [
            patient.patientTimeLineID,
            date
          ]);
          // console.log(`count : ${JSON.stringify(ret[0])}`);
          patient.notificationCount = ret[0][0].count;
          return patient;
        })
      );
    }

    const patients = results;
    const patientsWithPhotos = await Promise.all(
      patients.map(async (patient) => {
        if (patient.photo) {
          const imageURL = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: patient.photo
            }),
            { expiresIn: 300 }
          );
          patient.imageURL = imageURL;
        }
        patient.doctorName = patient.firstName + " " + patient.lastName;
        return patient;
      })
    );

    return patientsWithPhotos;
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 *** METHOD : GET
 *** DESCRIPTION : get patient by id and join the latest timeline
 ***
 */
const getPatientByID = async (hospitalID, id) => {
  try {
    const results = await pool.query(queryGetFullPatientByID, [hospitalID, id]);
    const foundPatient = results[0][0];
    if (!foundPatient) throw new Error("patient not found");
    let imageURL;
    if (foundPatient.photo) {
      imageURL = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: foundPatient.photo
        }),
        { expiresIn: 300 }
      );
    }
    foundPatient.imageURL = imageURL || null;
    foundPatient.doctorName =
      foundPatient.firstName + " " + foundPatient.lastName;
    let foundP;
    const arr = results[0];
    foundP = arr[arr.length - 1];

    return foundP;
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 *** METHOD : PATCH
 *** DESCRIPTION : get patient by id and update data
 ***
 */
const updatePatientByID = async (
  hospitalID,
  id,
  validateData,
  file,
  userID
) => {
  let connection = null;

  try {
    const [results] = await pool.query(queryGetPatientByID, [hospitalID, id]);
    // console.log(results);
    const foundPatient = results[0];
    // check if patient present
    if (!foundPatient) throw new Error("patient not found");
    // check if patient is not discharged
    if (foundPatient.ptype === patientUtils.patientStatus.discharged)
      throw new Error("cannot update discharged patient");

    let photo = null;
    if (file) {
      if (file.mimetype !== "image/png" && file.mimetype !== "image/jpeg") {
        throw new Error("only images allowed");
      }
      photo = generateFileName();
      const uploadParams = {
        Bucket: AWS_BUCKET_NAME,
        Body: file.buffer,
        Key: photo,
        ContentType: file.mimetype
      };
      await s3Client.send(new PutObjectCommand(uploadParams));
    }
    console.log("validated data", validateData);
    const updateData = {
      pUHID: validateData.pUHID || foundPatient.pUHID,
      category: validateData.category || foundPatient.category,
      dob: validateData.dob || foundPatient.dob,
      gender: validateData.gender || foundPatient.gender,
      weight: validateData.weight || foundPatient.weight,
      height: validateData.height || foundPatient.height,
      pName: validateData.pName || foundPatient.pName,
      phoneNumber: validateData.phoneNumber || foundPatient.phoneNumber,
      email: validateData.email || foundPatient.email,
      address: validateData.address || foundPatient.address,
      city: validateData.city || foundPatient.city,
      state: validateData.state || foundPatient.state,
      pinCode: validateData.pinCode || foundPatient.pinCode,
      referredBy: validateData.referredBy || foundPatient.referredBy,
      photo: photo || foundPatient.photo,
      insurance: validateData.insurance,
      insuranceNumber: validateData.insuranceNumber,
      insuranceCompany: validateData.insuranceCompany
    };
    let foundTimeLine;
    if (userID) {
      await updateTimeLineSchema.validateAsync({ userID });
      foundTimeLine = await pool.query(queryGetLatestTimeLine, [id]);
      // console.log("timeline", foundTimeLine);
      if (!foundTimeLine) throw new Error("Failed to get patient timeline");
    }
    connection = await pool.getConnection();
    await connection.beginTransaction();
    // console.log("updated data", updateData);
    await connection.query(queryUpdatePatientByID, [
      updateData.pUHID,
      updateData.category,
      updateData.dob,
      updateData.gender,
      updateData.weight,
      updateData.height,
      updateData.pName,
      updateData.phoneNumber,
      updateData.email,
      updateData.address,
      updateData.city,
      updateData.state,
      updateData.pinCode,
      updateData.referredBy,
      updateData.insurance,
      updateData.insuranceNumber,
      updateData.insuranceCompany,
      updateData.photo,
      hospitalID,
      id
    ]);
    // if (userID) {
    //   await connection.query(queryUpdatePatientTimeLineByID, [
    //     userID,
    //     foundTimeLine.id,
    //   ]);
    // }
    await connection.commit();

    let imageURL;
    if (updateData.photo) {
      imageURL = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: updateData.photo
        }),
        { expiresIn: 300 }
      );
      updateData.imageURL = imageURL;
    }
    return updateData;
  } catch (err) {
    throw new Error(err.message);
  }
};

const getPatientByIDForTriage = async (hospitalID, id) => {
  try {
    const results = await pool.query(queryGetFullPatientByIDForTriage, [
      hospitalID,
      id
    ]);

    const foundPatient = results[0][0];
    if (!foundPatient) throw new Error("patient not found");

    let imageURL;
    if (foundPatient.photo) {
      imageURL = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: foundPatient.photo
        }),
        { expiresIn: 300 }
      );
    }
    foundPatient.imageURL = imageURL || null;
    foundPatient.doctorName =
      foundPatient.firstName + " " + foundPatient.lastName;
    let foundP;
    const arr = results[0];
    foundP = arr[arr.length - 1];

    return foundP;
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : CHECK DEVICE PRESENT
 */
const checkDevicePresent = async (hospitalID, patientID) => {
  try {
    const result = await pool.query(queryGetPatientByID, [
      hospitalID,
      patientID
    ]);
    const foundPatient = result[0][0];
    if (!foundPatient) throw new Error("no patient found");
    if (!foundPatient.deviceID) throw new Error("no device found");
    const device = await pool.query(queryGetDevice, [foundPatient.deviceID]);

    return device[0][0];
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : get imageURL from photo object
 */
const getPhotoImageURL = async (photo) => {
  try {
    const imageURL = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: photo
      }),
      { expiresIn: 300 }
    );

    return imageURL;
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : get total patients in hospital
 */
const getTotalPatientCount = async (hospitalID) => {
  try {
    const results = await pool.query(queryCountAllPatients, [hospitalID]);

    return results[0][0]["COUNT(*)"];
  } catch (err) {
    throw new Error(err.message);
  }
};

const getCountOfPatientsByZone = async (hospitalID) => {
  try {
    const results = await pool.query(queryPatientCountForZone, [hospitalID]);

    return results[0];
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : get patient visit by department
 */
const getPatientVisitByDepartment = async (hospitalID) => {
  try {
    const results = await pool.query(queryGetDepartmentsPercentage, [
      hospitalID
    ]);
    // console.log(results[0]);
    const percentages = [];
    const uniqueArray = [...new Set(results[0].map((obj) => obj.name))];
    // console.log(uniqueArray)
    uniqueArray.map((item) => {
      const count = results[0].filter(
        (element) => element.name === item
      ).length;
      let percentage = ((count / results[0].length) * 100).toFixed(2);
      percentage = parseFloat(percentage);
      percentages.push({
        department: item,
        percentage: percentage
      });
    });

    return percentages;
  } catch (err) {
    throw new Error(err.message);
  }
};

const getPatientVisitByDepartmentWithFilter = async (
  hospitalID,
  ptype,
  filter
) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    await connection.query(querySetFilterOption(filter));
    const results = await connection.query(queryDepartmentDistribution, [
      hospitalID,
      ptype
    ]);
    await connection.commit();
    // console.log("------get distribution-------", results[0]);
    const sum = results[0].reduce((acc, curr) => acc + curr.count, 0);
    const finalResult = results[0].map((curr) => ({
      name: curr.name,
      percentage: (curr.count * 100) / sum
    }));

    return finalResult;
  } catch (err) {
    throw new Error(err.message);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : get count of patients based on type = inpatient,outpatient or emergency
 */
const getPatientCountByType = async (hospitalID, ptype) => {
  try {
    const results = await pool.query(queryCountPatientsByType, [
      hospitalID,
      ptype
    ]);
    return results[0][0]["COUNT(*)"];
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : get patient count for each month for the current year
 */
const getYearCount = async (hospitalID, ptype) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const monthCounts = [];
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];

    for (let i = 0; i < 12; i++) {
      const startDate = new Date(currentYear, i, 1);
      const endDate = new Date(currentYear, i + 1, 1);
      const result = await pool.query(queryGetCountBetweenDates, [
        hospitalID,
        // ptype,
        startDate,
        endDate
      ]);
      monthCounts.push({
        month: monthNames[i],
        count: result[0][0].count
      });
    }
    await connection.commit();

    return monthCounts;
  } catch (err) {
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

const getPatientCountOnFilter = async (
  hospitalID,
  ptype,
  zone,
  filter,
  filterValue
) => {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    await pool.query(querySetFilterOption(filter));

    let result;
    if (ptype != patientUtils.patientStatus.emergency)
      result = await pool.query(
        queryPatientCountWithFilter(filterValue, filter),
        [hospitalID, ptype]
      );
    else {
      if (!zone) throw new Error("zone missing");

      result = await pool.query(
        queryPatientCountWithFilterForEmergency(filterValue, filter, zone),
        [hospitalID, ptype]
      );
    }
    await connection.commit();

    return result[0];
  } catch (err) {
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
 * ** DESCRIPTION : get patient visit count based on year and month
 * ** if year = -1 , current year patient visit is returned
 * ** if month = -1 current month patient visit is retured
 * ** both cannot be -1
 */
const getPatientCountByMonthYear = async (hospitalID, year, month) => {
  let startDate, endDate;

  if (year === -1) {
    // Get new patient visit count this month
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    startDate = new Date(currentYear, currentMonth, 1);
    endDate = new Date(currentYear, currentMonth + 1, 1);
  } else if (month === -1) {
    // Get new patient visit count this year
    startDate = new Date(year, 0, 1);
    endDate = new Date(year + 1, 0, 1);
  } else {
    startDate = new Date(year, month, 1);
    endDate = new Date(year, month + 1, 1);
  }

  try {
    const results = await pool.query(queryPatientVisitByDate, [
      hospitalID,
      dateFormat(startDate),
      dateFormat(endDate)
    ]);
    const patientCount = results[0][0]["COUNT(*)"];

    const formatedstartDate = dateFormat(startDate);
    const formatedendDate = dateFormat(endDate);
    return {
      patientCount,
      formatedstartDate,
      formatedendDate
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

const getPatientVisitCountByMonthYear = async (hospitalID, ptype, zone) => {
  /////////Provide ptype in query////////////////////////

  try {
    let results;
    if (ptype != patientUtils.patientStatus.emergency)
      results = await pool.query(queryCountPatientVisitMonthAndYear, [
        hospitalID,
        ptype
      ]);
    else {
      if (!zone) throw new Error("zone missing");
      results = await pool.query(
        queryCountPatientVisitMonthAndYearForEmergency,
        [hospitalID, ptype, zone]
      );
    }

    return results[0];
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * ** METHOD : POST
 * ** DESCRIPTION : Create new patient with unique patientID in hospital and also patient timeline
 */
const addPatient = async (
  hospitalID,
  wardID,
  userID,
  file,
  patientData,
  departmentID
) => {
  let connection;
  try {
    const patientValidationResult = await patientSchema.validateAsync(
      patientData
    );
    let photo = null;
    if (file) {
      if (file.mimetype !== "image/png" && file.mimetype !== "image/jpeg") {
        throw new Error("only images allowed");
      }
      photo = generateFileName();
      const uploadParams = {
        Bucket: AWS_BUCKET_NAME,
        Body: file.buffer,
        Key: photo,
        ContentType: file.mimetype
      };
      await s3Client.send(new PutObjectCommand(uploadParams));
    }
    //
    patientData.photo = photo;

    // Validate patient timeline information
    // TODO CHECK patientStartStatus
    // TODO userID is always a doctor
    if (
      !wardID &&
      patientData.ptype != patientUtils.patientStatus.outpatient &&
      Number(patientData.ptype) != patientUtils.patientStatus.emergency
    ) {
      throw new Error("WardID is missing");
    }

    const patientTimelineData = {
      hospitalID,
      departmentID,
      patientStartStatus: patientData.ptype,
      wardID
    };

    if (patientData.ptype != patientUtils.patientStatus.emergency)
      await patientTimeLineSchema.validateAsync(patientTimelineData);

    // Check if patient with the same pID exists in the hospital
    const results = await pool.query(queryFindPatientByPID, [
      hospitalID,
      patientData.pID
    ]);
    if (results[0].length !== 0) {
      throw new Error("Patient Record Exists");
    }
    // console.log("testing here");
    connection = await pool.getConnection();
    await connection.beginTransaction();
    // console.log("lets insert.....", Object.values(patientData));
    if (wardID) {
      const decreaseWardBeds = await connection.query(queryDecreaseWardBed, [
        wardID
      ]);
      // console.log("decreased-------------------", decreaseWardBeds);
      if (!decreaseWardBeds[0].changedRows) {
        throw new Error("Ward reached it's maximum occupancy");
      }
    }

    const response = await connection.query(
      queryInsertPatient,
      Object.values(patientData)
    );
    // console.log("could it insert");
    await connection.query(querySetID);
    if (patientData.ptype != patientUtils.patientStatus.emergency) {
      const result = await connection.query(
        queryInsertPatientTimeLine,
        Object.values(patientTimelineData)
      );
      const patientTimeLineId = result[0].insertId;
      const result2 = await doctorService.addDoctor(
        connection,
        patientTimeLineId,
        userID,
        "primary",
        hospitalID
      );

      if (result2.status != 201) {
        connection.rollback();
        return { message: result2.message };
      }
    }
    await connection.commit();
    // get photo
    let imageURL;
    if (photo) {
      imageURL = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: photo
        }),
        { expiresIn: 300 }
      );
      patientData.imageURL = imageURL || null;
    }
    patientData.id = response[0].insertId;

    const [pat] = await pool.query(queryGetFullPatientByID, [
      hospitalID,
      patientData.id
    ]);
    let sendImageURL;
    if (pat?.[0]?.photo) {
      sendImageURL = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: pat?.[0]?.photo
        }),
        { expiresIn: 300 }
      );
      if (pat[0]) pat[0].imageURL = sendImageURL;
    }

    return {
      patient: pat?.[0]
    };
  } catch (err) {
    if (err.isJoi) {
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
 *** METHOD : GET
 *** DESCRIPTION : change patient status to discharged and end the latest timeline
 ***
 */
const dischargePatient = async (hospitalID, id, dischargeData) => {
  let connection = null;

  try {
    await dischargeSchema.validateAsync(dischargeData);

    const result = await pool.query(queryGetPatientForDischarge, [
      hospitalID,
      id
    ]);

    const foundPatient = result[0][0];
    if (!foundPatient) throw new Error("No Patient present");
    if (foundPatient.ptype !== foundPatient.patientStartStatus)
      throw new Error(
        `patient status and timeline status are different ${foundPatient.patientID}`
      );
    if (foundPatient.ptype === patientUtils.patientStatus.outpatient)
      throw new Error("outpatients cannot be discharged");
    if (foundPatient.patientEndStatus === patientUtils.patientStatus.discharged)
      throw new Error("patient already discharged");

    connection = await pool.getConnection();
    await connection.beginTransaction();
    await connection.query(queryIncreaseWardBed, [foundPatient.wardID]);
    if (dischargeData.followUpDate) {
      await connection.query(queryInsertFollowUp, [
        foundPatient.patientTimeLineID,
        dischargeData.followUpDate,
        patientUtils.followUpStatus.active
      ]);
    }

    const removeRes = await doctorService.removeAllDoctor(
      connection,
      foundPatient.patientTimeLineID,
      hospitalID
    );
    if (removeRes.status != 200) {
      throw new Error({ message: removeRes.message });
    }

    await connection.query(queryUpdatePatient, [
      patientUtils.patientStatus.discharged,
      foundPatient.patientID
    ]);

    await connection.query(queryUpdatePatientTimeLine, [
      patientUtils.patientStatus.discharged,
      dischargeData.dischargeType,
      dischargeData.diet,
      dischargeData.advice,
      dischargeData.followUp,
      dischargeData.followUpDate,
      dischargeData.icd,
      dischargeData.prescription,
      dischargeData.diagnosis,
      foundPatient.patientTimeLineID
    ]);
    await connection.commit();

    return {
      message: "success"
    };
  } catch (err) {
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
 * ** METHOD : POST
 * ** DESCRIPTION : PUT PATIENT BACK IN INPATIENT
 */
const patientRevisit = async (
  hospitalID,
  id,
  wardID,
  departmentID,
  ptype,
  userID
) => {
  let connection = null;
  try {
    const patientTimeLineData = {
      hospitalID,
      departmentID,
      patientStartStatus: ptype,
      wardID
    };
    await patientTimeLineSchema.validateAsync(patientTimeLineData);
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const queryCheckPatientTimeLineAcive = `SELECT * FROM patientTimeLine WHERE patientID = ? AND hospitalID = ? AND patientEndStatus IS NULL`;
    const result = await connection.query(queryCheckPatientTimeLineAcive, [
      id,
      hospitalID
    ]);

    if (result.length === 0) {
      throw new Error("Timeline already exist");
    }

    const update = await connection.query(queryUpdatePatientRevisit, [
      ptype,
      hospitalID,
      id
    ]);

    const { changedRows } = update[0];
    if (!changedRows) throw new Error("failed to update patient");
    const [insertTimeline] = await connection.query(
      queryRevisitPatientTimeLine(ptype),
      [
        patientTimeLineData.hospitalID,
        id,
        patientTimeLineData.departmentID,
        patientTimeLineData.patientStartStatus,
        wardID
      ]
    );
    const newTimelineID = insertTimeline.insertId;
    const result2 = await doctorService.addDoctor(
      connection,
      newTimelineID,
      userID,
      "primary",
      hospitalID
    );
    if (result2.status != 201) {
      connection.rollback();
      return {
        message: result2.message
      };
    }
    await connection.commit();
    return {
      message: "success"
    };
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

const transferPatient = async (
  hospitalID,
  id,
  departmentID,
  wardID,
  transferType,
  transferStatus,
  reqBodyData,
  userID
) => {
  let patientStatus;
  if (transferType == patientUtils.transferType.internal) {
    patientStatus = transferStatus || patientUtils.patientStatus.inpatient;
  } else {
    patientStatus = patientUtils.patientStatus.discharged;
  }

  /////Data to update the timeline
  const dischargeData = {
    dischargeType: patientUtils.dischargeType.transfer,
    patientStatus
  };
  let connection;
  try {
    const result = await pool.query(queryGetPatientForDischarge, [
      hospitalID,
      id
    ]);
    console.log("found patiient", result[0]);
    const foundPatient = result[0][0];
    if (!foundPatient) throw new Error("No Patient present");
    if (foundPatient.ptype !== foundPatient.patientStartStatus)
      throw new Error(
        `patient status and timeline status are different ${foundPatient.patientID}`
      );

    if (foundPatient.patientEndStatus === patientUtils.patientStatus.discharged)
      throw new Error("patient already discharged");

    ////Data to create a new timeline
    const patientTimelineData = {
      hospitalID,
      patientID: foundPatient.patientID,
      departmentID,
      patientStartStatus: patientStatus,
      wardID
    };

    // console.log("patient timeline data", patientTimelineData);

    connection = await pool.getConnection();
    await connection.beginTransaction();
    if (foundPatient.wardID)
      await connection.query(queryIncreaseWardBed, [foundPatient.wardID]);

    ////Close the old timeline
    await connection.query(queryUpdatePatientTimeLineForTransfer, [
      dischargeData.patientStatus,
      dischargeData.dischargeType,
      foundPatient.patientTimeLineID
    ]);
    let lastInsertedId;

    //////Creating new TimeLine
    // if (transferType != patientUtils.transferType.internal) {
    await connection.query(queryUpdatePatient, [
      patientStatus,
      foundPatient.patientID
    ]);
    // }

    ////////////////Updating the ptype of outpatients //////////////////////////
    // if (
    //   transferType == patientUtils.transferType.internal &&
    //   (foundPatient.ptype == patientUtils.patientStatus.outpatient ||
    //     foundPatient.ptype == patientUtils.patientStatus.emergency)
    // ) {
    //   await connection.query(queryUpdatePatient, [
    //     patientStatus,
    //     foundPatient.patientID,
    //   ]);
    // }
    //////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////

    if (patientStatus == patientUtils.patientStatus.inpatient) {
      if (!patientTimelineData.wardID) throw new Error("Ward missing");
      const decreaseWardBeds = await connection.query(queryDecreaseWardBed, [
        patientTimelineData.wardID
      ]);
      // console.log("decreased-------------------", decreaseWardBeds);
      if (!decreaseWardBeds[0].changedRows) {
        throw new Error("Ward reached it's maximum occupancy");
      }
    }
    if (transferType == patientUtils.transferType.internal) {
      await connection.query(
        queryInsertPatientTimeLineForTransfer(patientStatus),
        Object.values(patientTimelineData)
      );
      const lastInsertedIdResult = await connection.query(
        "SELECT LAST_INSERT_ID() as id"
      );
      lastInsertedId = lastInsertedIdResult[0][0].id;

      //Insert Doctor//////////////////////////
      const insertDoctor = await doctorService.addDoctor(
        connection,
        lastInsertedId,
        userID,
        "primary",
        hospitalID
      );
      if (insertDoctor.status != 201) {
        connection.rollback();
        return {
          message: insertDoctor.message
        };
      }
    }
    //////creating transfer data
    const transferData = {
      hospitalID,
      patientID: foundPatient.patientID,
      transferType,
      timelineID: foundPatient.patientTimeLineID,
      newTimelineID: lastInsertedId || null,
      ...reqBodyData
    };

    // console.log("transfer data-----1", transferData);
    await transferPatientSchema.validateAsync(transferData);
    await connection.query(queryInsertTransferPatient, [
      transferData.hospitalID,
      transferData.patientID,
      transferType,
      transferData.bp,
      transferData.temp,
      transferData.oxygen,
      transferData.pulse,
      transferData.reason,
      transferData.timelineID,
      transferData.newTimelineID,
      transferData.hospitalName,
      transferData.relativeName
    ]);
    // console.log("transfer data-----2", transferData);

    await connection.commit();
    foundTimeLine = await pool.query(queryGetLatestTimeLine, [
      foundPatient.patientID
    ]);

    return;
    timeline: [0][0];
  } catch (err) {
    if (err.isJoi) {
      throw new err.message();
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
 * ** DESCRIPTION : get list of 10 recently modified patients with type = inpatient, oupatient or emergency
 */
const getRecentPatientsByType = async (
  hospitalID,
  ptype,
  role,
  userID,
  zone,
  category
) => {
  // console.log(queryGetRecentPatientsByType(role, zone));
  // ptye emercrbecyb and patinet line shouklf not actrive exist nhi krta
  // limit 10
  let results;
  try {
    if (category == "triage") {
      const query = `SELECT patients.id, patients.hospitalID, patients.deviceID, patients.pID, patients.pUHID, patients.ptype, patients.category, patients.pName, 
      patients.dob, patients.gender, patients.weight, patients.height, 
      patients.phoneNumber, patients.email, patients.address, patients.city, patients.state, patients.pinCode, patients.referredBy, 
      patients.photo, patientTimeLine.startTime 
      FROM patients
      WHERE patients.hospitalID = ? 
      AND patients.ptype = "emergency" 
      AND patientTimeLine.patientEndStatus IS NOT NULL  
      LIMIT 10`;

      results = await pool.query(query, [hospitalID]);
    } else {
      results = await pool.query(
        queryGetRecentPatientsByType(role, zone, userID),
        [hospitalID, ptype]
      );
    }
    const patients = results[0];
    const patientsWithPhotos = await Promise.all(
      patients.map(async (patient) => {
        if (patient.photo) {
          const imageURL = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: patient.photo
            }),
            { expiresIn: 300 }
          );
          patient.imageURL = imageURL;
        }
        patient.doctorName = patient.firstName + " " + patient.lastName;
        return patient;
      })
    );
    return patientsWithPhotos;
  } catch (err) {
    throw new Error(err.message);
  }
};

module.exports = {
  checkIfpatientExists,
  getSummary,
  doctorSummary,
  getCalendarCard,
  getPercentageUseOfDevices,
  getPercentageUsageOfHubs,
  getAllPatientsByType,
  getpatientsForTriage,
  getAllPatientsByTypeWithFilter,
  getPatientByID,
  updatePatientByID,
  getPatientByIDForTriage,
  checkDevicePresent,
  getPhotoImageURL,
  getTotalPatientCount,
  getCountOfPatientsByZone,
  getPatientVisitByDepartment,
  getPatientVisitByDepartmentWithFilter,
  getPatientCountByType,
  getYearCount,
  getPatientCountOnFilter,
  getPatientCountByMonthYear,
  getPatientVisitCountByMonthYear,
  addPatient,
  dischargePatient,
  patientRevisit,
  transferPatient,
  getRecentPatientsByType
};
