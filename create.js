const pool = require("./v1/db/conn");
// const XLSX = require("xlsx");
const fs = require("fs");
const csv = require("csv-parser");
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS PincodeDistrict (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pincode VARCHAR(10) NOT NULL,
    district VARCHAR(255) NOT NULL
  )
`;
const createTableAndInsertData = async () => {
  // pool
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    await connection.query(createTableQuery);
    const csvFilePath = "./postalcode.csv";

    // Read the Excel sheet
    const values = [];
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (row) => {
        values.push([row.Pincode, row.District]);
      })
      .on("end", () => {
        // Insert data into the SQL table
        const insertDataQuery =
          "INSERT INTO PincodeDistrict (pincode, district) VALUES ?";

        connection.query(insertDataQuery, [values], (err, results) => {
          if (err) {
            console.error("Error inserting data:", err);
          } else {
            console.log(`${results.affectedRows} rows inserted`);
          }

          // Close the MySQL connection
        });
      });
    await connection.commit();
  } catch (err) {
    console.log(err);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
createTableAndInsertData();
