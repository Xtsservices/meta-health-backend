const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();
const pool = mysql
  .createPool({
    host: process.env.SQL_AWS_ADDRESS,
    user: process.env.SQL_AWS_USER,
    password: process.env.SQL_AWS_PASSWORD,
    database: process.env.SQL_AWS_DATABASE
  })
  .promise();

console.log("connect DB ");
// const pool = mysql
//   .createPool({
//     host: process.env.SQL_LOCAL_ADDRESS,
//     user: process.env.SQL_LOCAL_USER,
//     password: process.env.SQL_LOCAL_PASSWORD,
//     database: process.env.SQL_LOCAL_DATABASE,
//   })
//   .promise();

// console.log("connect DB ");

///////To connect to local database//////////
// const pool = mysql
//   .createPool({
//     host: process.env.SQL_LOCAL_ADDRESS,
//     user: process.env.SQL_LOCAL_USER,
//     password: process.env.SQL_LOCAL_PASSWORD,
//     database: process.env.SQL_LOCAL_DATABASE,
//   })
//   .promise();
/////////////////////////////////////////////////

//  pool.getConnection((err, connection) => {
//   if (err) {
//     console.error('Error connecting to MySQL pool:', err);
//     return;
//   }

//   console.log('MySQL pool is connected.');

//   // Release the connection
//   connection.release();
// });
// const pool = mysql
//   .createConnection({
//     host: process.env.SQL_LOCAL_ADDRESS,
//     user: process.env.SQL_LOCAL_USER,
//     password: process.env.SQL_LOCAL_PASSWORD,
//     database: process.env.SQL_LOCAL_DATABASE,
//   })
//   .promise();

// pool.on("connection", (connection) => {
//   console.log("Connected to MySQL database!");
// });
// pool.connect((err, connection) => {
//   if (err) {
//     console.error("Error connecting to MySQL pool:", err);
//     return;
//   }

//   console.log("MySQL pool is connected.");

//   // Release the connection
//   connection.release();
// });
module.exports = pool;
