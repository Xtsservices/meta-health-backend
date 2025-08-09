const { zoneCategory } = require("../../utils/zoneCategory");

const scoreList = {
  eyeMovement: {
    spontaneous: 4,
    "to sound": 3,
    "to pressure": 2,
    none: 1
  },
  verbalResponse: {
    oriented: 5,
    confused: 4,
    words: 3,
    sounds: 2,
    none: 1
  },
  motorResponse: {
    "obey commands": 6,
    localising: 5,
    "normal flexion": 4,
    "abnormal flexion": 3,
    extension: 2,
    none: 1
  }
};

const getVitalZone = (data) => {
  if (
    data.oxygen < 90 &&
    (data.respiratoryRate < 10 || data.respiratoryRate > 22)
  )
    return zoneCategory.red;
  if (
    (data.pulse < 50 || data.pulse >= 120) &&
    (data.bpH < 90 || data.bpH > 220)
  )
    return zoneCategory.red;
  if (data.temperature < 37.78 && (data.pulse < 50 || data.pulse >= 120))
    return zoneCategory.red;
  if (data.oxygen < 90) return zoneCategory.yellow;
  return zoneCategory.green;
};

const getBoolean = (val) => {
  return val === "yes";
};

const getZoneByABCD = (data) => {
  const { vitals, abcd } = data;

  const shockIndex = vitals.pulse / vitals.bpH;

  const angioStridor = getBoolean(abcd.angioedema) && getBoolean(abcd.stridor);
  const angioLowOxygen = getBoolean(abcd.angioedema) && vitals.oxygen < 90;
  const angioSeizures =
    getBoolean(abcd.angioedema) && getBoolean(abcd.activeSeizures);
  const feverLowOxygen = vitals.temperature > 37.78 && vitals.oxygen < 90;
  const fevLowOxyStridor = feverLowOxygen && getBoolean(abcd.stridor);
  const fevLowOxyRRImbalance =
    feverLowOxygen &&
    (vitals.respiratoryRate < 10 || vitals.respiratoryRate > 22);
  const radialPulse = getBoolean(abcd.radialPulse);
  const cSpineRRLow =
    getBoolean(abcd.cSpineInjury) && vitals.respiratoryRate < 15;
  const altSensoriumStridor =
    getBoolean(abcd.alteredSensorium) && getBoolean(abcd.stridor);
  const altSensoriumSeizures =
    getBoolean(abcd.alteredSensorium) && getBoolean(abcd.activeSeizures);
  const altSensoriumRRImbalance =
    getBoolean(abcd.alteredSensorium) &&
    (vitals.respiratoryRate < 10 || vitals.respiratoryRate > 22);
  const altSensoriumPulse =
    getBoolean(abcd.alteredSensorium) &&
    vitals.pulse < 50 &&
    vitals.pulse > 120;
  const activeHeavyBleeding =
    getBoolean(abcd.activeBleeding) && abcd.activeBleedingType === "major";

  if (
    angioStridor ||
    angioLowOxygen ||
    angioSeizures ||
    fevLowOxyStridor ||
    fevLowOxyRRImbalance ||
    radialPulse ||
    cSpineRRLow ||
    activeHeavyBleeding ||
    altSensoriumStridor ||
    altSensoriumSeizures ||
    altSensoriumRRImbalance ||
    altSensoriumPulse
  )
    return zoneCategory.red;

  const caseA =
    (getBoolean(abcd.noisyBreathing) || getBoolean(abcd.stridor)) &&
    getBoolean(abcd.angioedema) &&
    getBoolean(abcd.activeSeizures);
  const caseB =
    getBoolean(abcd.incompleteSentences) &&
    vitals.oxygen < 90 &&
    (vitals.respiratoryRate < 10 || vitals.respiratoryRate > 22);
  const caseC =
    abcd.capillaryRefill === ">2s" &&
    (abcd.radialPulse === "present" || abcd.radialPulse === "absent") &&
    (vitals.pulse < 50 || vitals.pulse > 120) &&
    (vitals.bpH > 220 || vitals.bpL < 90) &&
    shockIndex > 1;
  const caseD = getBoolean(abcd.cSpineInjury) && vitals.respiratoryRate < 15;

  if (caseA || caseB || caseC || caseD) return zoneCategory.red;
  if (getBoolean(abcd.alteredSensorium)) return zoneCategory.yellow;
  if (abcd.capillaryRefill === ">2s") return zoneCategory.yellow;
  if (getBoolean(abcd.activeBleeding) && abcd.activeBleedingType === "minor")
    return zoneCategory.yellow;

  return zoneCategory.green;
};

const getGcsZone = (data) => {
  const score = getGcsScore(data);
  if (score === 0) return null;
  if (score < 8) return zoneCategory.red;
  if (score < 13) return zoneCategory.yellow;
  return zoneCategory.green;
};

const getGcsScore = (data) => {
  let score = 0;
  const eM = scoreList.eyeMovement[data.eyeMovement];
  const vR = scoreList.verbalResponse[data.verbalResponse];
  const mR = scoreList.motorResponse[data.motorResponse];

  score = (eM ? eM : 0) + (vR ? vR : 0) + (mR ? mR : 0);
  return score;
};

const evalTraumaZone = (data) => {
  const {
    amputation,
    neckSwelling,
    suspectedAbuse,
    minorHeadInjury,
    traumaType,
    fracture,
    fractureRegion
  } = data;

  if (
    amputation ||
    neckSwelling ||
    (traumaType && traumaType !== "significant assault") ||
    (fracture &&
      (fractureRegion === "pelvic" ||
        fractureRegion === "multiple" ||
        fractureRegion === "open fractures excluding hand and feet"))
  ) {
    return zoneCategory.red;
  } else if (
    suspectedAbuse ||
    traumaType === "significant assault" ||
    minorHeadInjury ||
    (fracture && fractureRegion !== "isolated small bones of hand and feet")
  ) {
    return zoneCategory.yellow;
  }

  return zoneCategory.green;
};

const evalNonTraumaZone = (data) => {
  const {
    internalBleeding,
    internalBleedingCause,
    hanging,
    drowning,
    electrocution,
    heatStroke,
    poisoning,
    poisoningCause,
    burnPercentage,
    headache,
    dizziness,
    urinePass,
    stoolPass,
    swellingWound,
    drugOverdose,
    edema,
    breathlessness
  } = data;

  if (hanging || drowning || electrocution || heatStroke)
    return zoneCategory.red;
  if (internalBleeding && internalBleedingCause === "active")
    return zoneCategory.red;
  if (poisoning && (poisoningCause === "snake" || poisoningCause === "scorpio"))
    return zoneCategory.red;
  if (edema && breathlessness) return zoneCategory.red;
  if (!isNaN(Number(burnPercentage)) && Number(burnPercentage) > 20)
    return zoneCategory.red;

  const { feverSymptoms } = data;
  const internalBleedingYellowList = ["noseEnt", "pr"];
  if (internalBleedingYellowList.includes(internalBleedingCause))
    return zoneCategory.yellow;
  if (poisoning) return zoneCategory.yellow;
  if (
    headache ||
    dizziness ||
    urinePass ||
    stoolPass ||
    swellingWound ||
    drugOverdose
  )
    return zoneCategory.yellow;

  const feverSymptomsYellowList = [
    "headache",
    "chest pain",
    "jaundice",
    "chemotherapy",
    "hiv",
    "diabetic"
  ];
  if (feverSymptomsYellowList.includes(feverSymptoms))
    return zoneCategory.yellow;

  return zoneCategory.green;
};

module.exports = {
  getVitalZone,
  getZoneByABCD,
  getGcsZone,
  getGcsScore,
  evalTraumaZone,
  evalNonTraumaZone
};
