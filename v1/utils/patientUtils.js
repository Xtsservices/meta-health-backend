const patientStatus = {
  outpatient: 1,
  inpatient: 2,
  emergency: 3,
  operationTheatre: 4,
  discharged: 21
};
// 1 - discharge success , 2 - DOPR , 3 - Abscond , 4 - left against medical advice , 5 - death
const dischargeType = {
  success: 1,
  dopr: 2,
  abscond: 3,
  left: 4,
  death: 5,
  transfer: 6
};

const zoneType = {
  red: 1,
  yellow: 2,
  green: 3
};

const transferType = {
  internal: 1,
  external: 2,
  emergency: 3,
  nonEmergency: 4
};

const patientCategory = {
  neonate: 1,
  child: 2,
  adult: 3
};

const fileType = {
  image: 1,
  pdf: 2
};

const vitalAlertsType = {
  TemperatureAlert: 1,
  MedicineAlert: 2
};

const defaultTempAlerts = {
  LowFever: 1,
  ModerateFever: 2,
  HighFever: 3
};

const followUpStatus = {
  active: 1,
  end: 2
};

module.exports = {
  patientStatus,
  dischargeType,
  vitalAlertsType,
  defaultTempAlerts,
  transferType,
  followUpStatus,
  zoneType
};
