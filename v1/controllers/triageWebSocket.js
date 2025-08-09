const {
  getVitalZone,
  getZoneByABCD,
  getGcsZone,
  getGcsScore,
  evalTraumaZone,
  evalNonTraumaZone
} = require("../helper/triageValidator/vitals");

let previousCaseData = null;

const handleMessage = (ws, message) => {
  try {
    const parsedMessage = JSON.parse(message);
    console.log("type ", parsedMessage.type);
    switch (parsedMessage.type) {
      case "vitals":
        handleVitalRequest(ws, parsedMessage.data);
        break;
      case "ABCD":
        handleABCDRequest(ws, parsedMessage.data);
        break;
      case "GCS":
        handleGCSRequest(ws, parsedMessage.data);
        break;
      case "Trauma":
        handleTraumaRequest(ws, parsedMessage.data);
        break;
      case "nonTrauma":
        handleNonTraumaRequest(ws, parsedMessage.data);
        break;
      case "ping":
        break;
      default:
        handleNonRelatedRequest(ws, parsedMessage.data);
        break;
    }
  } catch (err) {
    console.log("Error in Triage type ", err.message);
    ws.send(err.message);
  }
};

const handleVitalRequest = (ws, data) => {
  try {
    console.log("Handling vital request with data:", data);
    // Ensure data matches the VitalsFormType structure
    const validData = validateVitalData(data);
    if (validData) {
      const zone = getVitalZone(data);
      previousCaseData = { ...previousCaseData, vitals: data };
      console.log("zone : ", zone);
      ws.send(JSON.stringify({ type: "vitalResponse", zone }));
    } else {
      ws.send(
        JSON.stringify({ type: "error", message: "Invalid data format" })
      );
    }
  } catch (err) {
    console.log("Error in Vital request ", err.message);
  }
};

function handleABCDRequest(ws, data) {
  try {
    console.log("Handling ABCD request with data:", data);
    console.log("previous vital data if any ", previousCaseData);
    if (validateABCDData(data)) {
      if (!previousCaseData || !previousCaseData.vitals) {
        ws.send(
          JSON.stringify({ type: "error", message: "Vitals data required" })
        );
        return;
      }
      const zone = getZoneByABCD({
        vitals: previousCaseData.vitals,
        abcd: data
      });
      previousCaseData = { ...previousCaseData, abcd: data };
      ws.send(JSON.stringify({ type: "ABCDResponse", zone }));
    } else {
      ws.send(
        JSON.stringify({ type: "error", message: "Invalid data format" })
      );
    }
  } catch (err) {
    console.log("Error in ABCD request ", err.message);
  }
}

function handleGCSRequest(ws, data) {
  try {
    console.log("Handling GCS request with data:", data);
    if (validateGCSData(data)) {
      const zone = getGcsZone(data);
      ws.send(
        JSON.stringify({ type: "GCSResponse", zone, score: getGcsScore(data) })
      );
    } else {
      ws.send(
        JSON.stringify({ type: "error", message: "Invalid data format" })
      );
    }
  } catch (err) {
    console.log("Error in GCS request ", err.message);
  }
}

function handleTraumaRequest(ws, data) {
  try {
    console.log("Handling trauma request with data:", data);
    if (validateTraumaData(data)) {
      const zone = evalTraumaZone(data);
      ws.send(JSON.stringify({ type: "traumaResponse", zone }));
    } else {
      ws.send(
        JSON.stringify({ type: "error", message: "Invalid data format" })
      );
    }
  } catch (err) {
    console.log("Error in Trauma request ", err.message);
  }
}

function handleNonTraumaRequest(ws, data) {
  try {
    console.log("Handling non-trauma request with data:", data);
    if (validateNonTraumaData(data)) {
      const zone = evalNonTraumaZone(data);
      ws.send(JSON.stringify({ type: "nontraumaResponse", zone }));
    } else {
      ws.send(
        JSON.stringify({ type: "error", message: "Invalid data format" })
      );
    }
  } catch (err) {
    console.log("Error in Non-Trauma request ", err.message);
  }
}

const validateVitalData = (data) => {
  console.log("data....", data["oxygen"]);
  const keys = [
    "oxygen",
    "pulse",
    "temperature",
    "bpH",
    "bpL",
    "respiratoryRate",
    "time"
  ];
  return keys.every(
    (key) =>
      key in data && typeof data[key] !== "undefined" && data[key] !== null
  );
};

function validateABCDData(data) {
  const keys = [
    "radialPulse",
    "noisyBreathing",
    "activeSeizures",
    "cSpineInjury",
    "stridor",
    "angioedema",
    "activeBleeding",
    "incompleteSentences",
    "capillaryRefill",
    "alteredSensorium",
    "activeBleedingType"
  ];
  return keys.every(
    (key) =>
      key in data && typeof data[key] !== "undefined" && data[key] !== null
  );
}

function validateGCSData(data) {
  const keys = ["eyeMovement", "verbalResponse", "motorResponse"];
  return keys.every(
    (key) =>
      key in data && typeof data[key] !== "undefined" && data[key] !== null
  );
}

function validateTraumaData(data) {
  const keys = [
    "traumaType",
    "fracture",
    "fractureRegion",
    "amputation",
    "neckSwelling",
    "minorHeadInjury",
    "abrasion",
    "suspectedAbuse",
    "fallHeight",
    "chestInjuryType",
    "stabInjurySeverity",
    "stabInjuryLocation",
    "stabHeadScalp",
    "stabHeadFace",
    "stabHeadNeck",
    "stabChestHeart",
    "stabChestLungs",
    "stabChestMajorBloodVessels",
    "stabAbdomenStomach",
    "stabAbdomenLiver",
    "stabAbdomenKidneys",
    "stabAbdomenSpleen",
    "stabAbdomenIntestines",
    "stabExtremityArm",
    "stabExtremityLeg",
    "stabExtremityMuscles",
    "stabExtremityTendons",
    "stabExtremityNerves",
    "stabExtremityBloodVessels"
  ];
  return keys.every(
    (key) =>
      key in data && typeof data[key] !== "undefined" && data[key] !== null
  );
}

function validateNonTraumaData(data) {
  const keys = [
    "pregnancy",
    "breathlessness",
    "edema",
    "internalBleeding",
    "poisoning",
    "burn",
    "hanging",
    "drowning",
    "electrocution",
    "heatStroke",
    "fever",
    "drugOverdose",
    "stoolPass",
    "urinePass",
    "swellingWound",
    "dizziness",
    "headache",
    "coughCold",
    "skinRash",
    "medicoLegalExamination"
  ];
  return keys.every(
    (key) =>
      key in data && typeof data[key] !== "undefined" && data[key] !== null
  );
}

const handleNonRelatedRequest = (ws, data) => {
  console.log("Handling monitor request with data:", data);
  ws.send(JSON.stringify({ type: "error", message: "Invalid triage type" }));
};

module.exports = {
  handleMessage
};
