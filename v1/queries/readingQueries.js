const queryAddReading = `INSERT INTO readings(hubID,deviceID,temperature,battery,deviceTime,uploadTime) 
VALUES(?,?,?,?,?,?)`;

const queryInsertVitals = `INSERT INTO 
    vitals(timeLineID,userID,temperature,deviceTime,battery,device)
    VALUES(?,?,?,?,?,?)`;
const queryAddAlert = `INSERT INTO vitalAlerts (timeLineID,vitalID,alertType,alertMessage,alertValue) 
    VALUES (?,?,?,?,?)`;

module.exports = {
  queryAddReading,
  queryInsertVitals,
  queryAddAlert
};
