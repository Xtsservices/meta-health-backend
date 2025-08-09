const axios = require("axios");
const cron = require("node-cron");

const apiCall = async (baseURL, token, hospitalID, patientID) => {
  try {
    const authPatch = axios.create({
      baseURL: baseURL,
      method: "patch",
      headers: {
        Accept: "application/json",
        Authorization: token
      }
    });
    const data = {
      wardID: "ward4",
      transferType: "internal",
      transferStatus: "operationTheatre"
    };
    const url = `patient/${hospitalID}/patients/${patientID}/transfer`;
    const response = await authPatch.patch(url, data);
    console.log(`Response from ${url}:`, response.data);
  } catch (error) {
    console.error(`Error making API call to :`, error);
  }
};

const scheduleApiCall = (
  cronExpression,
  hospitalID,
  patientID,
  baseURL,
  token
) => {
  console.log("heeeeelllllllloooooo");
  console.log("cronExpression::", cronExpression);
  console.log("baseURL", baseURL);
  console.log("token", token);

  cron.schedule(
    cronExpression,
    () => {
      console.log(`Running scheduled task for ${baseURL}`);
      apiCall(baseURL, token, hospitalID, patientID);
    },
    {
      scheduled: true,
      timezone: "Asia/Kolkata"
    }
  );
};

module.exports = { scheduleApiCall };
