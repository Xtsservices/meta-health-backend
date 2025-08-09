const pool = require("../db/conn");

const { readingsSchema } = require("../helper/validators/readingValidator");
const { vitalAlertsType, defaultTempAlerts } = require("../utils/patientUtils");

const {
  queryAddReading,
  queryInsertVitals,
  queryAddAlert
} = require("../queries/readingQueries");

function temperatureCheck(temperature) {
  console.log(temperature);
  if (temperature > 37.7 && temperature < 38.6) {
    return "Low Fever";
  } else if (temperature >= 38.6 && temperature < 39.4) {
    return "Moderate Fever";
  } else if (temperature >= 39.4) {
    return "High Fever";
  }
}

async function addNewReading(reading) {
  let connection;

  try {
    const temperature = parseFloat(reading.temperature) / 10;
    const device = 1; // Assuming device type 1 for now
    const tempCheck = temperatureCheck(temperature);

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Insert vitals reading
    const [vitalsResult] = await connection.query(queryInsertVitals, [
      parseInt(reading.timeLineID),
      null,
      temperature,
      parseInt(reading.deviceTime),
      parseInt(reading.battery),
      device
    ]);

    // If temperature check fails, handle alert separately
    if (tempCheck) {
      await connection.query(queryAddAlert, [
        reading.timeLineID,
        vitalsResult.insertId,
        vitalAlertsType.TemperatureAlert,
        tempCheck,
        temperature
      ]);
    }

    await connection.commit();
    return { message: "success" };
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

function timestampToSqlTimestamp(timestampMillis) {
  const date = new Date(timestampMillis);
  const sqlTimestamp = date.toISOString().slice(0, 19).replace("T", " ");
  return sqlTimestamp;
}

async function pingRequest() {
  try {
    // TODO update hub status to online

    return "success";
  } catch (err) {
    throw new Error(err.message);
  }
}

async function addHubLog() {
  try {
    // TODO update hub status to online

    return "success";
  } catch (err) {
    throw new Error(err.message);
  }
}

module.exports = {
  addNewReading,
  addHubLog,
  pingRequest
};
