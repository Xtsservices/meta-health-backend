const pool = require("../db/conn");
const vitaTrackPool = require("../db/vitalTrackConn");
const moment = require('moment');

const {
  queryInsertVitals,
  queryAddAlert,
  queryGetVitals,
  queryGetPulseFunctions,
  queryGetTemperatureFunctions,
  queryGetOxygenFunctions,
  queryGetBPFunctions,
  queryGetRespiratoryRateFunctions,
  queryGetHRVFunctions,
  givenTemperatureQuery,
  deviceQuery,
  vitalQuery,
  oxygenQuery,
  bpQuery,
  queryGetSingleVital,
  queryHomeGetHeartRateFunctions,
  queryGetHomeCareTemperatureFunctions,
  queryGetHomeCareSpo2Functions,
  queryGetHomeCareRespiratoryRateFunctions,
  queryGetHomeCareHRVFunctions,
  queryGetHomeBatteryPercentageFunctions,
  queryGetSingleVitalHospital
} = require("../queries/vitalsQueries");
const patientUtils = require("../utils/patientUtils");

function temperatureCheck(temperature) {
  if (temperature > 39 || temperature < 35) {
    if (temperature > 39) {
      return {
        message: "High Fever",
        priority: "High"
      };
    } else if (temperature < 35) {
      return {
        message: "Low Fever",
        priority: "High"
      };
    }
  } else if (temperature >= 38 && temperature <= 39) {
    return {
      message: "Moderate Fever",
      priority: "Medium"
    };
  } else if (temperature >= 37.2 && temperature <= 38) {
    return {
      message: "Low Fever",
      priority: "Low"
    };
  }

  // if (temperature < 28) {
  //   return {
  //     message: "Severe hypothermia",
  //     priority: "High"
  //   };
  // } else if (temperature >= 28 && temperature <= 32) {
  //   return {
  //     message: "Moderate hypothermia",
  //     priority: "Medium"
  //   };
  // } else if (temperature > 32 && temperature <= 35) {
  //   return {
  //     message: "Mild hypothermia",
  //     priority: "Low"
  //   };
  // } else if (temperature > 37.7 && temperature < 38.6) {
  //   return {
  //     message: "Low Fever",
  //     priority: "Low"
  //   };
  // } else if (temperature >= 38.6 && temperature < 39.4) {
  //   return {
  //     message: "Moderate Fever",
  //     priority: "Medium"
  //   };
  // } else if (temperature >= 39.4) {
  //   return {
  //     message: "High Fever",
  //     priority: "High"
  //   };
  // }
}

// ==============pulse combo with temperature =====

function pulsetempcomboCheck(pulse, temperature) {
  if (pulse < 40 && temperature < 35) {
    return {
      message: "Pulserate with temperature, is High",
      priority: "High"
    };
  } else if (
    pulse >= 101 &&
    pulse <= 130 &&
    temperature >= 38 &&
    temperature <= 39
  ) {
    return {
      message: "Pulserate with temperature, is Medium",
      priority: "Medium"
    };
  }
}

function pulseCheck(pulse) {
  //patient type = adult,child,neonate
  if (pulse > 130 || pulse < 40) {
    if (pulse > 130) {
      return {
        message: "Pulserate High",
        priority: "High"
      };
    } else if (pulse < 40) {
      return {
        message: "Pulserate Low",
        priority: "High"
      };
    }
  } else if ((pulse >= 101 && pulse <= 130) || (pulse >= 40 && pulse <= 60)) {
    return {
      message: "Pulserate Medium",
      priority: "Medium"
    };
  } else if (pulse >= 90 && pulse <= 100) {
    return {
      message: "Pulserate Low",
      priority: "Low"
    };
  }
}

// =====================oxygen and combo with pulse and respiratoryRate==================
function oxygenandPluseCheck(oxygen, pulse) {
  if (oxygen < 90 && pulse > 130) {
    return {
      message: "oxygen with pluse is high",
      priority: "High"
    };
  }
}

function oxygenandrespiratoryRateCheck(oxygen, respiratoryRate) {
  if (
    oxygen >= 91 &&
    oxygen <= 94 &&
    respiratoryRate >= 21 &&
    respiratoryRate <= 30
  ) {
    return {
      message: "oxygen with respiratoryRate is Medium",
      priority: "Medium"
    };
  }
}

function oxygenCheck(oxygen) {
  if (oxygen < 85) {
    return {
      message: "oxygen Low",
      priority: "High"
    };
  } else if (oxygen >= 85 && oxygen <= 90) {
    return {
      message: "Oxygen Medium",
      priority: "Medium"
    };
  } else if (oxygen >= 91 && oxygen <= 94) {
    return {
      message: "Oxygen Low",
      priority: "Low"
    };
  }
}

// ==========respiratorytempcomboCheck==========
function respiratorytempcomboCheck(respiratoryRate, temperature) {
  if (respiratoryRate > 30 && temperature > 39) {
    return {
      message: "respiratoryRate  with temperature, is High",
      priority: "High"
    };
  }
}

function respiratoryoxygencomboCheck(respiratoryRate, oxygen) {
  if (
    respiratoryRate >= 10 &&
    respiratoryRate <= 12 &&
    oxygen >= 85 &&
    oxygen <= 90
  ) {
    return {
      message: "respiratoryRate  with oxygen, is Medium",
      priority: "Medium"
    };
  }
}

function respiratoryAlertUpdate(respiratoryRate) {
  if (respiratoryRate > 30 || respiratoryRate < 10) {
    if (respiratoryRate > 30) {
      return {
        message: "Respiratory Rate, is High",
        priority: "High"
      };
    } else if (respiratoryRate < 10) {
      return {
        message: "Respiratory Rate, is Low",
        priority: "High"
      };
    }
  } else if (
    (respiratoryRate >= 21 && respiratoryRate <= 30) ||
    (respiratoryRate >= 10 && respiratoryRate <= 12)
  ) {
    return {
      message: "Respiratory Rate, is Medium",
      priority: "Medium"
    };
  } else if (respiratoryRate >= 16 && respiratoryRate <= 20) {
    return {
      message: "Respiratory Rate, is Low",
      priority: "Low"
    };
  }
}

//bpalerts systolic combo with pulse
function bpandpulsecomboCheck(systolic, pulse) {
  let message = "";
  let priority = "";

  if (systolic > 180 && pulse > 130) {
    message = "BP with Pulse, High";
    priority = "High";
  } else if (
    systolic >= 140 &&
    systolic <= 180 &&
    pulse >= 101 &&
    pulse <= 130
  ) {
    message = "BP with Pulse, Medium";
    priority = "Medium";
  }
  return { message, priority };
}

//bpalerts systolic combo with respiratoryRate
function bpandrespiratorycomboCheck(systolic, respiratoryRate) {
  let message = "";
  let priority = "";

  if (systolic < 90 && respiratoryRate > 30) {
    message = "BP with respiratoryRate, High";
    priority = "High";
  }
  return { message, priority };
}

//bpalerts diastolic combo with temperature
function bpandtemperaturecomboCheck(diastolic, temperature) {
  let message = "";
  let priority = "";
  if (
    diastolic >= 90 &&
    diastolic <= 120 &&
    temperature >= 38 &&
    temperature <= 39
  ) {
    message = "BP with temperature, Medium";
    priority = "Medium";
  }
  return { message, priority };
}

function bpCheck(bpString, age) {
  // Parse the blood pressure string
  const [systolic, diastolic] = bpString.split("/").map(Number);

  let message = "";
  let priority = "";

  // Define age-related ranges
  if (age <= 1) {
    // Newborns up to 1 month
    if (systolic < 60 || systolic > 90 || diastolic < 20 || diastolic > 60) {
      if (systolic < 60 && diastolic < 20) {
        message = "Blood pressure Low for Newborns";
        priority = "High";
      } else if (systolic > 90 && diastolic > 60) {
        message = "Blood pressure High for Newborns";
        priority = "High";
      }
    } else {
      message = "Normal";
      priority = "Low";
    }
  } else if (age <= 12) {
    // Infants, Toddlers, Preschoolers, School-aged children
    if (age <= 1) {
      if (systolic < 87 && diastolic < 53) {
        message = "Blood pressure Low for Infants";
        priority = "High";
      } else if (systolic > 105 && diastolic > 66) {
        message = "Blood pressure High for Infants";
        priority = "High";
      }
    } else if (age <= 3) {
      if (systolic < 95 && diastolic < 53) {
        message = "Blood pressure Low for Toddlers";
        priority = "High";
      } else if (systolic > 105 && diastolic > 66) {
        message = "Blood pressure High for Toddlers";
        priority = "High";
      }
    } else if (age <= 5) {
      if (systolic < 95 && diastolic < 56) {
        message = "Blood pressure Low for Preschoolers";
        priority = "High";
      } else if (systolic > 110 && diastolic > 70) {
        message = "Blood pressure High for Preschoolers";
        priority = "High";
      }
    } else if (age <= 12) {
      if (systolic < 97 && diastolic < 57) {
        message = "Blood pressure Low for School-aged children";
        priority = "High";
      } else if (systolic > 112 && diastolic > 71) {
        message = "Blood pressure High for School-aged children";
        priority = "High";
      }
    } else {
      message = "Normal";
      priority = "Low";
    }
  } else if (age <= 18) {
    // Adolescents
    if (systolic < 112 || systolic > 128 || diastolic < 66 || diastolic > 80) {
      if (systolic < 112 && diastolic < 66) {
        message = "Blood pressure Low for Adolescents";
        priority = "High";
      } else if (systolic > 128 && diastolic > 80) {
        message = "Blood pressure High for Adolescents";
        priority = "High";
      }
    } else {
      message = "Normal";
      priority = "Low";
    }
  } else {
    // Adults
    if (
      (systolic > 180 || systolic < 90) &&
      (diastolic > 120 || diastolic < 60)
    ) {
      message = "High Blood Pressure";
      priority = "High";
    } else if (
      systolic >= 140 &&
      systolic <= 180 &&
      diastolic >= 90 &&
      diastolic <= 120
    ) {
      message = "Medium Blood Pressure";
      priority = "Medium";
    } else if (
      systolic >= 120 &&
      systolic <= 140 &&
      diastolic >= 80 &&
      diastolic <= 90
    ) {
      message = "Low Blood Pressure";
      priority = "Low";
    }
  }

  return { message, priority };
}

function hrvCheckAlert(hrv, age) {
  let message = "";
  let priority = "";

  if (age <= 1) {
    // Infant
    if (hrv < 40) {
      message = "HRV Low for Infant";
      priority = "High";
    } else if (hrv > 100) {
      message = "HRV High for Infant";
      priority = "Medium";
    }
  } else if (age <= 12) {
    // Child (1-12 years)
    if (hrv < 40) {
      message = "HRV Low for Child";
      priority = "High";
    } else if (hrv > 130) {
      message = "HRV High for Child";
      priority = "Medium";
    }
  } else if (age <= 18) {
    // Adolescent
    if (hrv < 30) {
      message = "HRV Low for Adolescent";
      priority = "High";
    } else if (hrv > 110) {
      message = "HRV High for Adolescent";
      priority = "Medium";
    }
  } else {
    // Adult
    if (hrv < 20) {
      message = "HRV Low for Adult";
      priority = "High";
    } else if (hrv > 90) {
      message = "HRV High for Adult";
      priority = "Medium";
    }
  }

  if (!message) {
    message = "HRV Normal";
    priority = "Low";
  }

  return { message, priority };
}

const formatDateTime = (dateStr) => {
      if (!dateStr || dateStr === '') return null; // Return NULL for empty strings
      const parsed = moment(dateStr, moment.ISO_8601, true);
      if (!parsed.isValid()) return null; // Return NULL for invalid dates
      return parsed.format('YYYY-MM-DD HH:mm:ss'); // MySQL-compatible format
    };
async function addVitalsService(timeLineID, data) {
  try {
    const ward = data.ward;
    const age = data.age;
    console.log("Age----",age, timeLineID)
    console.log("data====",data)
    const result = await pool.query(queryInsertVitals, [
      timeLineID,
      data.userID,
      data.patientID,
      data.pulse,
     formatDateTime(data.pulseTime),
      data.temperature,
     formatDateTime(data.temperatureTime) ,
      data.oxygen,
      formatDateTime(data.oxygenTime),
      data.hrv,
      formatDateTime(data.hrvTime),
      data.respiratoryRate,
       formatDateTime(data.respiratoryRateTime),
      data.bp,
      formatDateTime(data.bpTime)
    ]);

    console.log("result===", result[0])
    data.id = result[0].insertId;

    // before add alerts verify patient should not in opd
    const pId = data.patientID;
    const isOpdQuery = "SELECT ptype from patients where id=?";
    const [isOpdPatient] = await pool.query(isOpdQuery, [pId]);
    const checkPtype = isOpdPatient[0].ptype;
console.log("checkPtype====", checkPtype)
    // Array to collect all potential alerts
    if (checkPtype == 1) return result;

    const alerts = [];

    // Temperature alert
    if (data?.temperature) {
      const tempCheck = temperatureCheck(data.temperature);
      if (tempCheck) {
        alerts.push({
          message: tempCheck.message,
          priority: tempCheck.priority,
          type: patientUtils.vitalAlertsType.TemperatureAlert,
          value: `${data.temperature} (°C)`,
          time: data.temperatureTime
        });
      }
    }

    //hrv alert
    if (data?.hrv) {
      const hrvCheck = hrvCheckAlert(data.hrv, age);
      if (hrvCheck) {
        alerts.push({
          message: hrvCheck.message,
          priority: hrvCheck.priority,
          type: patientUtils.vitalAlertsType.TemperatureAlert,
          value: `${data.hrv} (ms)`,
          time: data.hrvTime,
        });
      }
    }
    // Pulse alert
    if (data?.pulse) {
      let pulseAlert = null;
      let comboTemperature = true;
      if (data?.temperature) {
        const result = pulsetempcomboCheck(data.pulse, data.temperature);
        if (result) {
          pulseAlert = result;
          comboTemperature = false;
        }
      }
      if (comboTemperature) {
        const result = pulseCheck(data.pulse);
        if (result) {
          pulseAlert = result;
        }
      }

      if (pulseAlert) {
        alerts.push({
          message: pulseAlert.message,
          priority: pulseAlert.priority,
          type: patientUtils.vitalAlertsType.TemperatureAlert,
          value: `${data.pulse} beats/min`,
          time: data.pulseTime
        });
      }
    }

    // Respiratory Rate alert
    if (data?.respiratoryRate) {
      let respiratoryAlert = null;
      let comboTemp = true;
      let comboOxygen = true;
      if (data?.temperature) {
        const result = respiratorytempcomboCheck(
          data?.respiratoryRate,
          data?.temperature
        );
        if (result) {
          comboTemp = false;
          respiratoryAlert = result;
        }
      }
      if (data?.oxygen) {
        const result = respiratoryoxygencomboCheck(
          data?.respiratoryRate,
          data?.oxygen
        );
        if (result) {
          comboOxygen = false;
          respiratoryAlert = result;
        }
      }
      if (comboTemp && comboOxygen) {
        respiratoryAlert = respiratoryAlertUpdate(data?.respiratoryRate);
      }

      if (respiratoryAlert) {
        alerts.push({
          message: respiratoryAlert.message,
          priority: respiratoryAlert.priority,
          type: patientUtils.vitalAlertsType.TemperatureAlert,
          value: `${data.respiratoryRate} breaths/min`,
          time: data.respiratoryRateTime
        });
      }
    }

    // Blood Pressure alert
    if (data?.bp) {
      const [systolic, diastolic] = data.bp.split("/").map(Number);
      let bpAlert = null;
      let comboPulse = true;
      let comboRespiratoryRate = true;
      let comboTemperature = true;

      if (data?.pulse) {
        const result = bpandpulsecomboCheck(systolic, data.pulse);
        if (result) {
          bpAlert = result;
          comboPulse = false;
        }
      }
      if (data?.respiratoryRate) {
        const result = bpandrespiratorycomboCheck(
          systolic,
          data.respiratoryRate
        );
        if (result) {
          bpAlert = result;
          comboRespiratoryRate = false;
        }
      }
      if (data.temperature) {
        const result = bpandtemperaturecomboCheck(diastolic, data.temperature);
        if (result) {
          comboTemperature = false;
          bpAlert = result;
        }
      }
      if (comboPulse && comboRespiratoryRate && comboTemperature) {
        bpAlert = bpCheck(data.bp, age);
      }

      if (bpAlert) {
        alerts.push({
          message: bpAlert.message,
          priority: bpAlert.priority,
          type: patientUtils.vitalAlertsType.TemperatureAlert,
          value: `${data.bp}(HG)`,
          time: data.bpTime
        });
      }
    }

    // Oxygen alert
    if (data?.oxygen) {
      let oxygenAlert = null;
      let comboPulse = true;
      let comboRespiratoryRate = true;

      if (data?.pulse) {
        const comboOxygenAndPulse = oxygenandPluseCheck(
          data.oxygen,
          data.pulse
        );

        if (comboOxygenAndPulse) {
          comboPulse = false;
          oxygenAlert = comboOxygenAndPulse;
        }
      }
      if (data?.respiratoryRate) {
        const comboOxygenAndRR = oxygenandrespiratoryRateCheck(
          data.oxygen,
          data.respiratoryRate
        );

        if (comboOxygenAndRR) {
          oxygenAlert = comboOxygenAndRR;
          comboRespiratoryRate = false;
        }
      }
      if (comboPulse && comboRespiratoryRate) {
        oxygenAlert = oxygenCheck(data.oxygen);
      }

      if (oxygenAlert) {
        alerts.push({
          message: oxygenAlert.message,
          priority: oxygenAlert.priority,
          type: patientUtils.vitalAlertsType.TemperatureAlert,
          value: `${data.oxygen}%`,
          time: data.oxygenTime
        });
      }
    }

    // Function to combine messages and values
    function combineAlerts(alerts) {
      const combinedMessage = alerts.map((alert) => alert.message).join(" And ");
      const combinedValue = alerts.map((alert) => alert.value).join(" And ");
      const givenTime = alerts[0].time

      return { message: combinedMessage, value: combinedValue, time:givenTime };
    }

    // Define priority levels
    const priorityOrder = ["High", "Medium", "Low"];

    // Function to get the most severe alerts
    function getMostSevereAlerts(alerts) {
      for (const priority of priorityOrder) {
        const filteredAlerts = alerts.filter(
          (alert) => alert.priority === priority
        );
        if (filteredAlerts.length > 0) {
          // Combine alerts if more than one found
          return filteredAlerts.length > 1
            ? combineAlerts(filteredAlerts)
            : filteredAlerts[0];
        }
      }
      // Return null if no alerts found
      return null;
    }

    // Determine the most severe alerts to add
    const mostSevereAlert = getMostSevereAlerts(alerts);
    console.log("mostSevereAlert",mostSevereAlert)

    // Add the most severe alert to the database if it exists
    //this 3 rd param 1 temperature alerts
    if (mostSevereAlert) {
      await pool.query(queryAddAlert, [
        timeLineID,
        data.id,
        1,
        mostSevereAlert.message,
        mostSevereAlert.value,
        ward,
        mostSevereAlert.priority ||
        priorityOrder.find((p) =>
          alerts.some((alert) => alert.priority === p)
        ), // Find the priority if combined
        mostSevereAlert.time || new Date().toISOString() // Use the time from the first alert or current time if combined
      ]);
    }

    return result;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getAllVitals(patientID) {
  try {
    const results = await pool.query(queryGetVitals, [patientID]);
    return results;
  } catch (err) {
    throw new Error(err.message);
  }
}

function incrementDate(date) {
  const initialDate = new Date(date);
  initialDate.setHours(0, 0, 0, 0);
  initialDate.setHours(initialDate.getHours() - 5);
  initialDate.setMinutes(initialDate.getMinutes() - 30);
  initialDate.setDate(initialDate.getDate() + 1);
  return initialDate;
}

function incrementMillis(date) {
  const initialDate = new Date(date);
  initialDate.setDate(initialDate.getDate() + 1);
  return initialDate.getTime();
}

async function getSingleVital(patientID, vital, date) {
  try {
    let result;

     // Validate date format (YYYY-MM-DD)
     if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error("Invalid or missing date parameter (use YYYY-MM-DD)");
    }

    if (vital == "temperature") {
      result = await pool.query(queryGetSingleVital, [
        patientID,
        "temperature",
        date,
        "deviceTime"
      ]);
    } else if (vital == "pulse") {
      result = await pool.query(queryGetSingleVital, [
        patientID,
        "pulse",
        date,
        "pulseTime"
      ]);
    } else if (vital == "oxygen") {
      result = await pool.query(queryGetSingleVital, [
        patientID,
        "oxygen",
         date,
        "oxygenTime"
      ]);
    } else if (vital == "bp") {
      result = await pool.query(queryGetSingleVital, [
        patientID,
        "bp",
        date,
        "bpTime"
      ]);
    } else if (vital == "respiratoryRate") {
      result = await pool.query(queryGetSingleVital, [
        patientID,
        "respiratoryRate",
        date,
        "respiratoryRateTime"
      ]);
    } else if (vital == "hrv") {
      result = await pool.query(queryGetSingleVital, [
        patientID,
        "hrv",
        date,
        "hrvTime"
      ]);
    } else {
      throw new Error("unknown vital selected");
    }

    return result;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getSingleVitalHospital(patientID, vital, date) {
  try {
    let result;
 
   
 
    if (vital == "temperature") {
      result = await pool.query(queryGetSingleVitalHospital, [
        patientID,
        "temperature",
     
        "deviceTime"
      ]);
    } else if (vital == "pulse") {
      result = await pool.query(queryGetSingleVitalHospital, [
        patientID,
        "pulse",
    
        "pulseTime"
      ]);
    } else if (vital == "oxygen") {
      result = await pool.query(queryGetSingleVitalHospital, [
        patientID,
        "oxygen",
     
        "oxygenTime"
      ]);
    } else if (vital == "bp") {
      result = await pool.query(queryGetSingleVitalHospital, [
        patientID,
        "bp",
     
        "bpTime"
      ]);
    } else if (vital == "respiratoryRate") {
      result = await pool.query(queryGetSingleVitalHospital, [
        patientID,
        "respiratoryRate",
     
        "respiratoryRateTime"
      ]);
    } else if (vital == "hrv") {
      result = await pool.query(queryGetSingleVitalHospital, [
        patientID,
        "hrv",
     
        "hrvTime"
      ]);
    } else {
      throw new Error("unknown vital selected");
    }
 
    return result;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getLatestVitals(patientID) {
  try {
    const connection = await pool.getConnection();

    const [tempGivenResult] = await connection.query(givenTemperatureQuery, [
      patientID
    ]);
    const [tempDeviceResult] = await connection.query(deviceQuery, [patientID]);
    const [pulseResult] = await connection.query(vitalQuery, [patientID]);
    const [oxygenResult] = await connection.query(oxygenQuery, [patientID]);
    const [bpResult] = await connection.query(bpQuery, [patientID]);

    connection.release();

    let result = {
      givenTemperature: tempGivenResult[0]?.temperature,
      givenTemperatureTime: tempGivenResult[0]?.temperatureTime || null,
      deviceTemperature: tempDeviceResult[0]?.temperature,
      deviceTemperatureTime: tempDeviceResult[0]?.deviceTime || null,
      pulse: pulseResult[0]?.pulse || 0,
      pulseTime: pulseResult[0]?.pulseTime || null,
      oxygen: oxygenResult[0]?.oxygen || 0,
      oxygenTime: oxygenResult[0]?.oxygenTime || null,
      bp: bpResult[0]?.bp || "",
      bpTime: bpResult[0]?.bpTime || null
    };

    return result;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getVitalFunctions(patientID) {
  try {
    const pulseResult = await pool.query(queryGetPulseFunctions, [patientID]);
    const tempertureResult = await pool.query(queryGetTemperatureFunctions, [
      patientID
    ]);
    const oxygenResult = await pool.query(queryGetOxygenFunctions, [patientID]);
    const bpResult = await pool.query(queryGetBPFunctions, [patientID]);
    const respiratoryRateResult = await pool.query(queryGetRespiratoryRateFunctions, [patientID]);
    const hrvResult = await pool.query(queryGetHRVFunctions, [patientID]);
    let result = {
      pulse: pulseResult[0][0],
      temperature: tempertureResult[0][0],
      oxygen: oxygenResult[0][0],
      bp: bpResult[0][0],
      respiratoryRate: respiratoryRateResult[0][0],
      hrv: hrvResult[0][0]
    };

    return result;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getHomecareVitalFunctions(patientID) {
  try {
    const heartRateResult = await vitaTrackPool.query(queryHomeGetHeartRateFunctions, [patientID]);
    const temperatureResult = await vitaTrackPool.query(queryGetHomeCareTemperatureFunctions, [patientID]);
    const spo2Result = await vitaTrackPool.query(queryGetHomeCareSpo2Functions, [patientID]);
    const respiratoryRateResult = await vitaTrackPool.query(queryGetHomeCareRespiratoryRateFunctions, [patientID]);
    const hrvResult = await vitaTrackPool.query(queryGetHomeCareHRVFunctions, [patientID]);
    const batteryPercentageResult = await vitaTrackPool.query(queryGetHomeBatteryPercentageFunctions, [patientID]);

    const result = {
      heartRate: {
        avg: heartRateResult[0][0].avgHeartRate ? `${parseFloat(heartRateResult[0][0].avgHeartRate).toFixed(2)} beats/min` : null,
        min: heartRateResult[0][0].minHeartRate ? `${parseFloat(heartRateResult[0][0].minHeartRate).toFixed(2)} beats/min` : null,
        max: heartRateResult[0][0].maxHeartRate ? `${parseFloat(heartRateResult[0][0].maxHeartRate).toFixed(2)} beats/min` : null
      },
      temperature: {
        avg: temperatureResult[0][0].avgTemperature ? `${parseFloat(temperatureResult[0][0].avgTemperature).toFixed(2)}°C` : null,
        min: temperatureResult[0][0].minTemperature ? `${parseFloat(temperatureResult[0][0].minTemperature).toFixed(2)}°C` : null,
        max: temperatureResult[0][0].maxTemperature ? `${parseFloat(temperatureResult[0][0].maxTemperature).toFixed(2)}°C` : null
      },
      spo2: {
        avg: spo2Result[0][0].avgSpo2 ? `${parseFloat(spo2Result[0][0].avgSpo2).toFixed(2)}%` : null,
        min: spo2Result[0][0].minSpo2 ? `${parseFloat(spo2Result[0][0].minSpo2).toFixed(2)}%` : null,
        max: spo2Result[0][0].maxSpo2 ? `${parseFloat(spo2Result[0][0].maxSpo2).toFixed(2)}%` : null
      },
      respiratoryRate: {
        avg: respiratoryRateResult[0][0].avgRespiratoryRate ? `${parseFloat(respiratoryRateResult[0][0].avgRespiratoryRate).toFixed(2)} breaths/min` : null,
        min: respiratoryRateResult[0][0].minRespiratoryRate ? `${parseFloat(respiratoryRateResult[0][0].minRespiratoryRate).toFixed(2)} breaths/min` : null,
        max: respiratoryRateResult[0][0].maxRespiratoryRate ? `${parseFloat(respiratoryRateResult[0][0].maxRespiratoryRate).toFixed(2)} breaths/min` : null
      },
      heartRateVariability: {
        avg: hrvResult[0][0].avgHRV ? `${parseFloat(hrvResult[0][0].avgHRV).toFixed(2)} ms` : null,
        min: hrvResult[0][0].minHRV ? `${parseFloat(hrvResult[0][0].minHRV).toFixed(2)} ms` : null,
        max: hrvResult[0][0].maxHRV ? `${parseFloat(hrvResult[0][0].maxHRV).toFixed(2)} ms` : null
      },
      batteryPercentage: {
        avg: batteryPercentageResult[0][0].avgBatteryPercentage ? `${parseFloat(batteryPercentageResult[0][0].avgBatteryPercentage).toFixed(2)}%` : null,
        min: batteryPercentageResult[0][0].minBatteryPercentage ? `${parseFloat(batteryPercentageResult[0][0].minBatteryPercentage).toFixed(2)}%` : null,
        max: batteryPercentageResult[0][0].maxBatteryPercentage ? `${parseFloat(batteryPercentageResult[0][0].maxBatteryPercentage).toFixed(2)}%` : null
      }
    };

    return result;
  } catch (err) {
    throw new Error(err.message);
  }
}


async function getHomeCarePatient(patientID, vital, date) {
  try {
    let result;

    const queryGetSingleVitalHome = `SELECT * from vitals where patientID = ? And DATE(addedOn) = ?`    
     // Validate date format (YYYY-MM-DD)
     if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error("Invalid or missing date parameter (use YYYY-MM-DD)");
    }
      result = await vitaTrackPool.query(queryGetSingleVitalHome, [
        patientID,
        date
      ]);

    return result;
  } catch (err) {
    throw new Error(err.message);
  }
}



module.exports = {
  addVitalsService,
  getAllVitals,
  getSingleVital,
  getLatestVitals,
  getVitalFunctions,
  getHomecareVitalFunctions,
  getHomeCarePatient,
  getSingleVitalHospital
};
