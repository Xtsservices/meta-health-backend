const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

  // =======FOR NVCORE===========
  const nvcorePool = mysql
  .createPool({
    host: process.env.SQL_AWS_ADDRESS,
    user: process.env.SQL_AWS_USER,
    password: process.env.SQL_AWS_PASSWORD,
    database: process.env.SQL_AWS_DATABASE_NV_CORE
  })
  .promise();
  
  console.log("connect DB ");
  module.exports = nvcorePool;

  
