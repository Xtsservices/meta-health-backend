const queryInsertVitals = `INSERT INTO 
    vitals(timeLineID,userID,patientID,pulse,pulseTime,temperature,temperatureTime,
        oxygen,oxygenTime, hrv, hrvTime, respiratoryRate,respiratoryRateTime,bp,bpTime,addedOn,givenTime)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,now(),now())`;

const queryAddAlert = `INSERT INTO vitalAlerts (timeLineID,vitalID,alertType,alertMessage,alertValue,ward,priority,datetime) 
    VALUES (?,?,?,?,?,?,?,?)`;

const queryGetVitals = `SELECT * FROM vitals WHERE patientID=?`;

const queryGetPulseFunctions = `select 
    avg(pulse) as avgPulse,
    min(pulse) as minPulse,
    max(pulse) as maxPulse 
    from vitals 
    where patientID=? AND pulse!=0`;

const queryGetTemperatureFunctions = `select 
    avg(temperature) as avgTemperature,
    min(temperature) as minTemperature,
    max(temperature) as maxTemperature 
    from vitals 
    where patientID=? AND temperature!=0`;

const queryGetOxygenFunctions = `select 
    avg(oxygen) as avgOxygen,
    min(oxygen) as minOxygen,
    max(oxygen) as maxOxygen
    from vitals 
    where patientID=? AND oxygen!=0`;

const queryGetBPFunctions = `select 
    avg(bp) as avgBp,
    min(bp) as minBp,
    max(bp) as maxBp
    from vitals 
    where patientID=? AND bp!=0`;

  const queryGetRespiratoryRateFunctions = `select 
    avg(respiratoryRate) as avgRespiratoryRate,
    min(respiratoryRate) as minRespiratoryRate,
    max(respiratoryRate) as maxRespiratoryRate 
    from vitals 
    where patientID=? AND respiratoryRate!=0`;

  const queryGetHRVFunctions = `select 
    avg(hrv) as avgHRV,
    min(hrv) as minHRV,
    max(hrv) as maxHRV 
    from vitals 
    where patientID=? AND hrv!=0`;

  const queryGetSingleVital = `SELECT * 
      FROM vitals 
      WHERE patientID = ? 
      AND ?? != 0  
      AND DATE(addedOn) = ? 
      ORDER BY ?? ASC`;

  const queryGetSingleVitalHospital = `SELECT *
      FROM vitals
      WHERE patientID = ?
      AND ?? != 0  
   
      ORDER BY ?? ASC`;

const givenTemperatureQuery =
  "SELECT temperature,temperatureTime FROM vitals WHERE patientID = ? AND temperature IS NOT NULL ORDER BY temperatureTime DESC LIMIT 1";
const deviceQuery =
  "SELECT temperature,deviceTime FROM vitals WHERE patientID = ? AND temperature IS NOT NULL ORDER BY deviceTime DESC LIMIT 1";
const vitalQuery =
  "SELECT pulse,pulseTime FROM vitals WHERE patientID = ? AND pulse IS NOT NULL ORDER BY pulseTime DESC LIMIT 1";
const oxygenQuery =
  "SELECT oxygen,oxygenTime FROM vitals WHERE patientID = ? AND oxygen IS NOT NULL ORDER BY oxygenTime DESC LIMIT 1";
const bpQuery =
  "SELECT bp,bpTime FROM vitals WHERE patientID = ? AND bp IS NOT NULL ORDER BY bpTime DESC LIMIT 1";


  const queryHomeGetHeartRateFunctions = `SELECT 
    AVG(CAST(heartRate AS DECIMAL(10,2))) AS avgHeartRate,
    MIN(CAST(heartRate AS DECIMAL(10,2))) AS minHeartRate,
    MAX(CAST(heartRate AS DECIMAL(10,2))) AS maxHeartRate 
    FROM vitals 
    WHERE patientID = ? AND heartRate != '0'`;

const queryGetHomeCareTemperatureFunctions = `SELECT 
    AVG(CAST(temperature AS DECIMAL(10,2))) AS avgTemperature,
    MIN(CAST(temperature AS DECIMAL(10,2))) AS minTemperature,
    MAX(CAST(temperature AS DECIMAL(10,2))) AS maxTemperature 
    FROM vitals 
    WHERE patientID = ? AND temperature != '0'`;

const queryGetHomeCareSpo2Functions = `SELECT 
    AVG(CAST(spo2 AS DECIMAL(10,2))) AS avgSpo2,
    MIN(CAST(spo2 AS DECIMAL(10,2))) AS minSpo2,
    MAX(CAST(spo2 AS DECIMAL(10,2))) AS maxSpo2
    FROM vitals 
    WHERE patientID = ? AND spo2 != '0'`;

const queryGetHomeCareRespiratoryRateFunctions = `SELECT 
    AVG(CAST(respiratoryRate AS DECIMAL(10,2))) AS avgRespiratoryRate,
    MIN(CAST(respiratoryRate AS DECIMAL(10,2))) AS minRespiratoryRate,
    MAX(CAST(respiratoryRate AS DECIMAL(10,2))) AS maxRespiratoryRate 
    FROM vitals 
    WHERE patientID = ? AND respiratoryRate != '0'`;

const queryGetHomeCareHRVFunctions = `SELECT 
    AVG(CAST(heartRateVariability AS DECIMAL(10,2))) AS avgHRV,
    MIN(CAST(heartRateVariability AS DECIMAL(10,2))) AS minHRV,
    MAX(CAST(heartRateVariability AS DECIMAL(10,2))) AS maxHRV 
    FROM vitals 
    WHERE patientID = ? AND heartRateVariability != '0'`;

const queryGetHomeBatteryPercentageFunctions = `SELECT 
    AVG(CAST(batteryPercentage AS DECIMAL(10,2))) AS avgBatteryPercentage,
    MIN(CAST(batteryPercentage AS DECIMAL(10,2))) AS minBatteryPercentage,
    MAX(CAST(batteryPercentage AS DECIMAL(10,2))) AS maxBatteryPercentage 
    FROM vitals 
    WHERE patientID = ? AND batteryPercentage != '0'`;

module.exports = {
  queryInsertVitals,
  queryAddAlert,
  queryGetVitals,
  queryGetPulseFunctions,
  queryGetTemperatureFunctions,
  queryGetOxygenFunctions,
  queryGetBPFunctions,
  givenTemperatureQuery,
  deviceQuery,
  vitalQuery,
  oxygenQuery,
  bpQuery,
  queryGetSingleVital,
  queryGetRespiratoryRateFunctions,
  queryGetHRVFunctions,
  queryHomeGetHeartRateFunctions,
  queryGetHomeCareTemperatureFunctions,
  queryGetHomeCareSpo2Functions,
  queryGetHomeCareRespiratoryRateFunctions,
  queryGetHomeCareHRVFunctions,
  queryGetHomeBatteryPercentageFunctions,
  queryGetSingleVitalHospital
};
