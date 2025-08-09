const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

// =======FOR Vital track===========
const vitaTrackPool = mysql
    .createPool({
        host: process.env.SQL_AWS_ADDRESS,
        user: process.env.SQL_AWS_USER,
        password: process.env.SQL_AWS_PASSWORD,
        database: process.env.SQL_AWS_DATABASE_VITAL_TRACK
    })
    .promise();

console.log("connect DB vitaTrackPool");
module.exports = vitaTrackPool;


