const pool = require("../db/conn");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand
} = require("@aws-sdk/client-s3");

const {
  queryCheckIfpatientExistWithMobileNumber,
  queryInsertPatientPharmacy,
  queryInsertMedicineInventoryPatientWithout
} = require("../queries/medicineInventoryPatientsQueries");

const crypto = require("crypto");

const generateFileName = (bytes = 16) =>
  crypto.randomBytes(bytes).toString("hex");

const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const AWS_BUCKET_REGION = process.env.AWS_BUCKET_REGION;
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;

const s3Client = new S3Client({
  region: AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY
  }
});

const addPatientWithOrder = async (
  hospitalID,
  medicineList,
  patientData,
  userID,
  paymentMethod,
  discount,
  selectedFile
) => {
  try {
    const [response] = await pool.query(
      queryCheckIfpatientExistWithMobileNumber,
      [hospitalID, patientData.mobileNumber, patientData.pName]
    );

    if (response.length > 0) {
      return { status: 500, message: "Patient Already Exists" };
    }

    const fileName = generateFileName();
    const uploadParams = {
      Bucket: AWS_BUCKET_NAME,
      Body: selectedFile[0].buffer,
      Key: fileName,
      ContentType: selectedFile[0].mimetype
    };
    await s3Client.send(new PutObjectCommand(uploadParams));

    let medicineNames = medicineList.map((medicine) => medicine.name);

    if (medicineNames.length > 0) {
      const query = `SELECT id, name, quantity , used FROM medicineInventory WHERE hospitalID = ?
      AND  name IN (${medicineNames.map(() => "?").join(", ")})
      AND expiryDate >= NOW() 
      AND quantity > 0 
      ORDER BY expiryDate ASC
        `;

      const [inventoryResults] = await pool.query(query, [
        hospitalID,
        ...medicineNames
      ]);

      const medicinesToUpdate = [];

      for (let medicine of medicineList) {
        let requiredQty = medicine.quantity;

        for (let item of inventoryResults) {
          if (item.id === medicine.id && requiredQty > 0) {
            let deductQty = Math.min(requiredQty, item.quantity); // Ensure we don't deduct more than available

            medicinesToUpdate.push({
              id: item.id,
              quantity: item.quantity - deductQty,
              used: item.used + deductQty
            });

            requiredQty -= deductQty;

            if (requiredQty === 0) break;
          }
        }

        if (requiredQty > 0) {
          return { status: 500, message: `${medicine.name} stock is low` };
        }
      }

      let paymentDetails = [];
      paymentDetails.push(paymentMethod);

      const [insertPatientResponse] = await pool.query(
        queryInsertPatientPharmacy,
        [
          hospitalID,
          patientData.patientID,
          patientData.name,
          patientData.mobileNumber,
          patientData.city,
          fileName,
          (medicinesList = JSON.stringify(medicineList)),
          (paymentDetails = JSON.stringify(paymentDetails)),
          userID
        ]
      );

      if (insertPatientResponse.affectedRows < 0) {
        return { status: 500, message: "Patient Not Added" };
      }

      if (medicinesToUpdate.length > 0) {
        const updateQuery = `
    UPDATE medicineInventory
    SET 
      quantity = CASE id
        ${medicinesToUpdate.map(() => "WHEN ? THEN ?").join(" ")}
      END,
      used = CASE id
        ${medicinesToUpdate.map(() => "WHEN ? THEN ?").join(" ")}
      END
    WHERE id IN (${medicinesToUpdate.map(() => "?").join(", ")});
  `;
        const queryParams = [];

        medicinesToUpdate.forEach((item) => {
          queryParams.push(item.id, item.quantity); // For quantity CASE
        });
        medicinesToUpdate.forEach((item) => {
          queryParams.push(item.id, item.used); // For used CASE
        });
        medicinesToUpdate.forEach((item) => {
          queryParams.push(item.id); // For WHERE IN condition
        });

        // Execute the query
        await pool.query(updateQuery, queryParams);
      }

      [insertResponse] = await pool.query(
        queryInsertMedicineInventoryPatientWithout,
        [
          hospitalID,
          JSON.stringify(medicineList),
          "completed",
          paymentDetails,
          JSON.stringify(discount),
          insertPatientResponse.insertId
        ]
      );

      if (insertResponse.affectedRows > 0) {
        return { status: 200, message: "Successfully Added" };
      }
    }
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const addWalkinPatients = async (
  hospitalID,
  testsList,
  patientData,
  userID,
  paymentMethod,
  discount,
  files,
  department
) => {
  try {
    // Check if patient already exists in testsalepatients
    const [response] = await pool.query(
      "SELECT id FROM walkinPatientsTests WHERE hospitalID = ? AND phoneNumber = ? AND pName = ?",
      [hospitalID, patientData.mobileNumber, patientData.pName]
    );

    if (response.length > 0) {
      return { status: 400, message: "Patient Already Exists" };
    }

    files.map(async (file) => {
      const allowedMimeTypes = [
        "image/png",
        "image/jpeg",
        "application/pdf",
        "audio/mpeg",
        "video/mp4"
      ];

      if (file) {
        if (!allowedMimeTypes.includes(file.mimetype)) {
          throw new Error("only images, pdf, mp3 allowed");
        }

        const fileName = generateFileName();
        const uploadParams = {
          Bucket: AWS_BUCKET_NAME,
          Body: file.buffer,
          Key: fileName,
          ContentType: file.mimetype
        };
        await s3Client.send(new PutObjectCommand(uploadParams));

        // Insert new patient record into testsalepatients table
        const insertQuery = `
    INSERT INTO walkinPatientsTests 
    (hospitalID,userID,pName,phoneNumber, city,addedOn, pID, fileName, testsList,discount,paymentDetails,department) 
    VALUES (?, ?, ?, ?,?, NOW(), ?, ?, ?, ?, ?,?)
  `;

        const values = [
          hospitalID,
          userID,
          patientData.name,
          patientData.mobileNumber,
          patientData.city,
          patientData.patientID,
          fileName,
          JSON.stringify(testsList),
          JSON.stringify(discount),
          JSON.stringify(paymentMethod),
          department
        ];

        await pool.query(insertQuery, values);
      }
    });

    return { status: 200, message: "Success" };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

module.exports = {
  addPatientWithOrder,
  addWalkinPatients
};
