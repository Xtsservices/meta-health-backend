const pool = require("../db/conn");
const dayjs = require("dayjs");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand
} = require("@aws-sdk/client-s3");

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

const {
  queryCheckGetPatientTimeLine,
  queryInsertMedicineInventoryPatientOrder,
  queryGetMedicineInventoryPatientOrderIfExist,
  queryGetMedicineInventoryPatientOrder,
  queryUpdatePatientOrder,
  queryGetMedicineInventoryPatientOrderWithType,
  queryGetDepartmentConsumption,
  queryGetMedicineInfo,
  queryGetMedicineInventoryPatientTimeLineID,
  queryGetExpiryProductInfo,
  queryGetLowStockProductInfo,
  queryGetMedicineInventoryPatientsOrderCompletedWithoutReg,
  queryGetMedicineInventoryPatientsOrderCompletedWithRegPatient,
  queryGetMedicineInfoUsedPrice,
  queryGetMedicineInfoinStockPrice,
  queryGetMedicineInfoexpiryPrice,
  querygetRejectedData,
  queryGetMedicineInventoryPatientsOrderCompletedWithRegPatientWithDate,
  queryGetMedicineInventoryPatientsOrderCompletedWithoutRegWithDate
} = require("../queries/medicineInventoryPatientsOrderQueries");
const medicineTypes = require("../utils/medUtils");

const addPatientMedicineOrder = async (medicineValues) => {
  const medicineData = medicineValues[0];
  const {
    timeLineID,
    patientID,
    userID,
    medicineName,
    medicineType,
    daysCount,
    Frequency,
    notes
  } = medicineData;

  let [timelineResponse] = await pool.query(queryCheckGetPatientTimeLine, [
    patientID
  ]);

  if (timelineResponse.length === 0) {
    return { status: 404, message: "Timeline not found" };
  }

  const { hospitalID, departmentID, patientStartStatus } = timelineResponse[0];

  [getResponse] = await pool.query(
    queryGetMedicineInventoryPatientOrderIfExist,
    [hospitalID, patientID]
  );

  const newMedicine = [
    {
      id: Date.now(), //Unique ID using timestamp
      medicineName: medicineName,
      medicineType: medicineType,
      daysCount: daysCount,
      Frequency: Frequency,
      status: "pending",
      datetime: new Date().toISOString(),
      userID
    }
  ];

  if (getResponse.length > 0) {
    let medicinesData = getResponse[0]?.medicinesList || "[]";

    medicinesData.push(newMedicine[0]);
    const query = `
        UPDATE medicineInventoryPatientsOrder
        SET medicinesList = ?
        WHERE patientID = ?
        `;

    await pool.query(query, [JSON.stringify(medicinesData), patientID]);
  } else {
    [InsertResponse] = await pool.query(
      queryInsertMedicineInventoryPatientOrder,
      [
        hospitalID,
        timeLineID,
        patientID,
        departmentID,
        patientStartStatus,
        userID,
        JSON.stringify(newMedicine),
        notes,
        "pending"
      ]
    );
  }
};

//patient orders rejected tab
const getMedicineInventoryPatientsOrder = async (hospitalID, status) => {
  try {
    if (status === "rejected") {
      try {
        let [response] = await pool.query(querygetRejectedData, [hospitalID]);
        if (response.length == 0) {
          return { status: 200, data: response };
        }
        response = response
          .map((each) => {
            each.medicinesList = each.medicinesList.filter(
              (medicine) => medicine.status === "rejected"
            );
            return each;
          })
          .filter((each) => each.medicinesList.length > 0); // Remove patients with no rejected medicines;

        return { status: 200, data: response };
      } catch (error) {
        return { status: 500, message: error.message };
      }
    }

    let [response] = await pool.query(queryGetMedicineInventoryPatientOrder, [
      hospitalID,
      status
    ]);

    if (response.length == 0) {
      return { status: 200, data: response };
    }

    //filter medicinelist with status is pending
    response = response.map((item) => {
      item.medicinesList = item.medicinesList.filter(
        (medicine) => medicine.status === "pending"
      );
      return item;
    });

    let medicineNames = response.map((item) => item?.medicinesList);

    medicineNames = medicineNames
      .flat()
      .map((medicine) => medicine.medicineName);
    const query = `SELECT id , name , category, hsn , sellingPrice, quantity FROM medicineInventory WHERE name IN (${medicineNames
      .map(() => "?")
      .join(", ")})`;
    const [inventoryResults] = await pool.query(query, medicineNames);

    response = response.map((item) => {
      item.medicinesList = item.medicinesList.map((medicine) => {
        // Find matching medicine in inventoryResults by name
        const matchingInventory = inventoryResults.find(
          (inv) => inv.name === medicine.medicineName
        );

        // Attach inventory data if found
        if (matchingInventory) {
          return {
            Frequency: medicine?.Frequency,
            daysCount: medicine?.daysCount,
            medicineType: medicine?.medicineType,
            medId: medicine?.id,
            ...matchingInventory // Adding inventory data to medicine
          };
        }

        // If no matching inventory, return medicine as is
        return medicine;
      });

      return item;
    });

    return { status: 200, data: response };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const updatePatientOrderStatus = async (
  hospitalID,
  status,
  patientTimeLineID,
  reasons,
  updatedQuantities,
  rejectReason,
  nurseID,
  dueAmount,
  paidAmount,
  totalAmount,
  paymentMethod
) => {
  try {
    // Check if the status is 'rejected', if so, skip inventory checks
    if (status === "rejected") {
      const queryGetOrder = `
    SELECT medicinesList FROM medicineInventoryPatientsOrder 
    WHERE hospitalID = ? AND patientTimeLineID = ?
  `;

      const [orderResults] = await pool.query(queryGetOrder, [
        hospitalID,
        patientTimeLineID
      ]);
      if (orderResults.length === 0) {
        return { status: 404, message: "Order not found" };
      }
      let totalmedicinedata = orderResults[0].medicinesList;

      let medicinedata = orderResults[0]?.medicinesList.filter(
        (order) => order.status === "pending"
      );

      // Update status and rejectReason inside the medicinesList
      medicinedata = medicinedata.map((medicine) => ({
        ...medicine,
        status: "rejected",
        reason: rejectReason // Assigning rejectReason to each medicine
      }));

      // Step 1: Get IDs from medicinedata
      const medicineIdsToRemove = new Set(medicinedata.map((m) => m.id));

      // Step 2: Remove entries from total if ID exists in medicinedata
      const filteredTotal = totalmedicinedata.filter(
        (m) => !medicineIdsToRemove.has(m.id)
      );

      // Step 3: Add new medlist data
      const updatedMedicineList = [...filteredTotal, ...medicinedata];

      const updateMedicinesListQuery = `
      UPDATE medicineInventoryPatientsOrder
      SET medicinesList = ?
      WHERE hospitalID = ? AND patientTimeLineID = ?;
    `;

      // Update medicines list in the database
      const [response] = await pool.query(updateMedicinesListQuery, [
        JSON.stringify(updatedMedicineList),
        hospitalID,
        patientTimeLineID
      ]);

      if (response.affectedRows > 0) {
        return { status: 201 };
      }
      return {
        status: 400,
        message: "Failed to update order status to rejected"
      };
    } else if (status === "payment") {
      try {
        // 1. Fetch existing paymentDetails from DB
        const getPaymentQuery = `
          SELECT paymentDetails,  paidAmount, dueAmount
          FROM medicineInventoryPatientsOrder
          WHERE hospitalID = ? AND patientTimeLineID = ?;
        `;

        const [results] = await pool.query(getPaymentQuery, [
          hospitalID,
          patientTimeLineID
        ]);

        if (!results.length) {
          return { status: 404, message: "Order not found" };
        }

        let existingPaymentDetails = results[0].paymentDetails || "[]";
        let currentPaidAmount = Number(results[0].paidAmount) || 0;

        // 2. Parse existing paymentDetails (handle JSON string)
        let paymentDetailsArray;
        try {
          paymentDetailsArray =
            typeof existingPaymentDetails === "string"
              ? JSON.parse(existingPaymentDetails)
              : existingPaymentDetails;
        } catch (error) {
          paymentDetailsArray = []; // Fallback if JSON parsing fails
        }

        // Ensure paymentDetails is an array
        if (!Array.isArray(paymentDetailsArray)) {
          paymentDetailsArray = []; // Convert object to array if needed
        }

        // 3. Append new payment entry with timestamp
        const newPaymentEntry = {
          ...paymentMethod,
          timestamp: new Date().toISOString() // Add timestamp for tracking
        };
        paymentDetailsArray.push(newPaymentEntry);

        // 4. Calculate new amounts
        const newTotalAmount = Number(totalAmount);
        const newPaidAmount = currentPaidAmount + Number(paidAmount);
        const newDueAmount = newTotalAmount - newPaidAmount;

        // 5. Update paymentDetails & amounts in DB
        const updateQuery = `
          UPDATE medicineInventoryPatientsOrder
          SET paymentDetails = ?, totalAmount = ?, paidAmount = ?, dueAmount = ?
          WHERE hospitalID = ? AND patientTimeLineID = ?;
        `;

        const [updateResult] = await pool.query(updateQuery, [
          JSON.stringify(paymentDetailsArray), // Store updated JSON
          newTotalAmount.toFixed(2),
          newPaidAmount.toFixed(2),
          newDueAmount.toFixed(2),
          hospitalID,
          patientTimeLineID
        ]);

        if (updateResult.affectedRows > 0) {
          return {
            status: 200,
            message: "Payment details updated successfully",
            paymentDetails: paymentDetailsArray,
            totalAmount: newTotalAmount,
            paidAmount: newPaidAmount,
            dueAmount: newDueAmount
          };
        } else {
          return { status: 500, message: "Failed to update payment details" };
        }
      } catch (error) {
        console.error("Error updating payment details:", error);
        return { status: 500, message: "Internal server error" };
      }
    }

    let [MedicineOrderResponse] = await pool.query(
      queryGetMedicineInventoryPatientTimeLineID,
      [hospitalID, patientTimeLineID]
    );

    if (!MedicineOrderResponse || MedicineOrderResponse.length === 0) {
      return { status: 404, message: "No Patient Found" };
    }

    let patientTotalAmount =
      parseFloat(MedicineOrderResponse[0]?.totalAmount) || 0;

    // Extract current medicinesList from response
    let totalmedicinedata = MedicineOrderResponse.map((item) =>
      item?.medicinesList ? item.medicinesList : []
    ).flat();

    // Extract medicine list from patient order
    let medicinedata = MedicineOrderResponse[0]?.medicinesList.filter(
      (order) => order.status === "pending"
    ); // Process only pending orders

    if (medicinedata.length === 0) {
      return { status: 400, message: "No medicines to process" };
    }

    // Extract medicine names & categories
    let medicineNames = medicinedata.map((medicine) => medicine.medicineName);
    let medicineCategories = medicinedata.map((medicine) =>
      Object.keys(medicineTypes).find(
        (key) => medicineTypes[key] == Number(medicine.medicineType)
      )
    );

    medicinedata = medicinedata.map((medicine) => {
      const updatedQty = updatedQuantities[medicine.id]; // Direct lookup

      return {
        ...medicine,
        reason: reasons[medicine.id] || medicine.reason || null,
        updatedQuantity:
          updatedQty !== undefined
            ? updatedQty
            : medicine.Frequency * medicine.daysCount // Use updatedQty if available
      };
    });

    // Fetch medicine inventory based on name and category
    const query = `
  SELECT id, name, category, quantity, sellingPrice, used, hsn, gst, expiryDate 
  FROM medicineInventory 
  WHERE  hospitalID = ? 
  AND (name, category) IN (${medicineNames.map(() => "(?, ?)").join(", ")}) 
  AND expiryDate >= NOW() 
  AND quantity > 0 
  AND isActive = 1
  ORDER BY expiryDate ASC`; // Sort by nearest expiry date first

    const queryValues = [hospitalID];
    medicineNames.forEach((name, index) => {
      queryValues.push(name.trim(), medicineCategories[index]);
    });

    const [inventoryResults] = await pool.query(query, queryValues);

    // If inventoryResults is empty, return a message indicating low stock
    if (inventoryResults.length === 0) {
      return {
        status: 200,
        message: "Stock is low for the selected medicines."
      };
    }
    let updatedMedicinedata = [];
    medicinedata.forEach((medicine) => {
      let requiredQty = medicine.updatedQuantity;
      let inventoryMatches = inventoryResults.filter(
        (item) =>
          item.name.trim() === medicine.medicineName.trim() &&
          item.category ===
            medicineCategories[
              medicineNames.indexOf(medicine.medicineName.trim())
            ]
      );

      for (let inventoryItem of inventoryMatches) {
        if (requiredQty <= 0) break; // Stop if we have fulfilled the required quantity

        let availableQty = inventoryItem.quantity; // Available stock for the nearest expiry batch

        if (availableQty > 0) {
          let usedQty = Math.min(requiredQty, availableQty); // Take the minimum of what's needed and available
          //total amount calculation
          patientTotalAmount +=
            usedQty * inventoryItem.sellingPrice +
            (usedQty * inventoryItem.sellingPrice * inventoryItem.gst) / 100;

          // Add a new medicine entry if splitting is needed
          updatedMedicinedata.push({
            ...medicine,
            updatedQuantity: usedQty,
            sellingPrice: inventoryItem.sellingPrice,
            takenFromInventoryID: inventoryItem.id,
            hsn: inventoryItem.hsn,
            gst: inventoryItem.gst
          });

          requiredQty -= usedQty; // Reduce required quantity
        }
      }
    });

    // Replace original medicinedata with updated one
    medicinedata = updatedMedicinedata;

    const medicinesToUpdate = [];
    const lowStockMedicines = [];
    const stockHistoryMedicines = [];

    for (let inventoryItem of inventoryResults) {
      const medicine = medicinedata.find(
        (med) => med.medicineName.trim() === inventoryItem.name.trim()
      );

      if (!medicine) continue;

      const amountToDeduct = medicine.updatedQuantity;

      if (inventoryItem.quantity - amountToDeduct < 0) {
        lowStockMedicines.push(inventoryItem.name);
      } else {
        medicinesToUpdate.push({
          name: inventoryItem.name.trim(),
          quantity: inventoryItem.quantity - amountToDeduct,
          used: inventoryItem.used + amountToDeduct,
          inventoryId: inventoryItem.id // Track batch ID
        });
        stockHistoryMedicines.push({
          inStock: inventoryItem.quantity - amountToDeduct,
          used: amountToDeduct,
          inventoryId: inventoryItem.id, // Track batch ID
          hospitalID: hospitalID,
          expireDate: inventoryItem.expiryDate
        });
      }
    }

    // If there are medicines with low stock, return an error message
    if (lowStockMedicines.length > 0) {
      return {
        status: 200,
        message: `Stock is low for: ${lowStockMedicines.join(", ")}`
      };
    }

    medicinedata = medicinedata.map((medicine) => {
      const isLowStock = lowStockMedicines.includes(
        medicine.medicineName.trim()
      ); // Check if in low stock
      return {
        ...medicine,

        nurseID: isLowStock ? medicine.nurseID : nurseID, // Update only if not in low stock
        status: isLowStock ? medicine.status : status // Update only if not in low stock
      };
    });

    if (medicinesToUpdate.length === 0) {
      return {
        status: 200,
        message: "No medicine updates required. Stock levels are sufficient."
      };
    }

    const updateQuery = `
          UPDATE medicineInventory
          SET
            quantity = CASE 
              ${medicinesToUpdate.map((item) => `WHEN id = ? THEN ?`).join(" ")}
            END,
            used = CASE 
              ${medicinesToUpdate.map((item) => `WHEN id = ? THEN ?`).join(" ")}
            END
          WHERE id IN (${medicinesToUpdate.map(() => "?").join(", ")});
          `;

    const queryParams = [];

    // Prepare query parameters for `quantity` and `used` updates
    medicinesToUpdate.forEach((item) => {
      queryParams.push(item.inventoryId, item.quantity); // For `quantity` column
    });
    medicinesToUpdate.forEach((item) => {
      queryParams.push(item.inventoryId, item.used); // For `used` column
    });

    // Prepare query parameters for `WHERE` condition
    medicinesToUpdate.forEach((item) => {
      queryParams.push(item.inventoryId);
    });

    // Execute the query
    await pool.query(updateQuery, queryParams);

    // Step 1: Get IDs from medicinedata
    const medicineIdsToRemove = new Set(medicinedata.map((m) => m.id));

    // Step 2: Remove entries from total if ID exists in medicinedata
    const filteredTotal = totalmedicinedata.filter(
      (m) => !medicineIdsToRemove.has(m.id)
    );

    // Step 3: Add new medlist data
    const updatedMedicineList = [...filteredTotal, ...medicinedata];

    const updateMedicinesListQuery = `
      UPDATE medicineInventoryPatientsOrder
      SET medicinesList = ?, totalAmount=?
      WHERE hospitalID = ? AND patientTimeLineID = ?;
    `;

    // Update medicines list in the database
    [response] = await pool.query(updateMedicinesListQuery, [
      JSON.stringify(updatedMedicineList), // Converting the updated list to JSON
      patientTotalAmount,
      hospitalID,
      patientTimeLineID
    ]);

    //update to medicineStockHistory
    const stockHistoryValues = stockHistoryMedicines.map((item) => [
      item.inventoryId,
      item.hospitalID,
      item.used,
      item.inStock,
      item.expireDate
    ]);
    const updateStockHistory = `
    INSERT INTO medicineStockHistory 
    (medicineInventoryID, hospitalID, soldQty, inStock, expireDate)
    VALUES ${stockHistoryValues.map(() => "(?, ?, ?, ?, ?)").join(", ")}
  `;

    // Flatten values for parameterized query
    const values = stockHistoryValues.flat();

    // Execute the query
    await pool.query(updateStockHistory, values);

    if (response.affectedRows > 0) {
      return { status: 201 };
    }
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const getMedicineInventoryPatientsOrderWithType = async (
  hospitalID,
  status,
  departmemtType
) => {
  try {
    const departmentFilter =
      Number(departmemtType) === 2 ? [2, 3] : [Number(departmemtType)];

    const queryGetMedicineInventoryPatientOrderWithType = `
SELECT medicineInventoryPatientsOrder.id,medicineInventoryPatientsOrder.hospitalID,users.firstName,users.lastName,
medicineInventoryPatientsOrder.medicinesList,medicineInventoryPatientsOrder.status,medicineInventoryPatientsOrder.paymentDetails,
medicineInventoryPatientsOrder.notes,medicineInventoryPatientsOrder.addedOn,medicineInventoryPatientsOrder.departmemtType,
medicineInventoryPatientsOrder.totalAmount, medicineInventoryPatientsOrder.paidAmount, medicineInventoryPatientsOrder.dueAmount,
patients.pName,medicineInventoryPatientsOrder.patientTimeLineID,
 patients.id as patientID, departments.name as location FROM medicineInventoryPatientsOrder
LEFT JOIN patientTimeLine ON medicineInventoryPatientsOrder.patientTimeLineID = patientTimeLine.id 
LEFT JOIN patients ON patientTimeLine.patientID = patients.id
LEFT JOIN departments on medicineInventoryPatientsOrder.location = departments.id
LEFT JOIN users on medicineInventoryPatientsOrder.doctorID = users.id
where medicineInventoryPatientsOrder.hospitalID = ?  and medicineInventoryPatientsOrder.departmemtType IN(${departmentFilter
      .map(() => "?")
      .join(",")}) order by addedOn desc`;

    let [response] = await pool.query(
      queryGetMedicineInventoryPatientOrderWithType,
      [hospitalID, ...departmentFilter]
    );

    if (response.length == 0) {
      return { status: 200, data: response };
    }

    // Step 1: Filter medicines inside the medicinesList based on status
    response = response
      .map((order) => {
        order.medicinesList = order.medicinesList.filter(
          (medicine) => medicine?.status === status
        );
        return order;
      })
      .filter((order) => order.medicinesList.length > 0);

    // Step 2: Remove patients where totalAmount === paidAmount
    response = response.filter(
      (order) =>
        !order.paymentDetails || // Keep if paymentDetails is null or empty
        parseFloat(order.totalAmount) !== parseFloat(order.paidAmount) // Otherwise, apply normal check
    );

    return { status: 200, data: response };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const getDepartmentConsumption = async (hospitalID, fromDate, toDate) => {
  try {
    let [response] = await pool.query(queryGetDepartmentConsumption, [
      hospitalID
    ]);

    if (response.length == 0) {
      return { status: 200, data: [] };
    }

    let inPatient = 0,
      outPatient = 0,
      emergency = 0;

    const calculatePaymentSum = (data, fromDate, toDate) => {
      return data.map((entry) => {
        const paymentDetails = entry.paymentDetails;

        const filteredPayments = paymentDetails.filter((payment) => {
          const paymentDate = new Date(payment.timestamp)
            .toISOString()
            .split("T")[0];
          return paymentDate >= fromDate && paymentDate <= toDate;
        });

        const totalSum = filteredPayments.reduce((acc, payment) => {
          return (
            acc +
            (payment.cash || 0) +
            (payment.cards || 0) +
            (payment.online || 0)
          );
        }, 0);

        return {
          departmemtType: entry.departmemtType,
          totalSum
        };
      });
    };

    const results = calculatePaymentSum(response, fromDate, toDate);

    results.forEach((element) => {
      if (element.departmemtType == 3) {
        emergency += element.totalSum;
      }
      if (element.departmemtType == 2) {
        inPatient += element.totalSum;
      }
      if (element.departmemtType == 1) {
        outPatient += element.totalSum;
      }
    });

    return { status: 200, data: [{ inPatient, outPatient, emergency }] };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const getMedicinesInfo = async (hospitalID, fromDate, toDate) => {
  try {
    //queryGetMedicineInfoUsedPrice
    const [usedPriceResult] = await pool.query(queryGetMedicineInfoUsedPrice, [
      hospitalID,
      fromDate,
      toDate
    ]);
    const usedPrice =
      usedPriceResult?.length > 0 ? usedPriceResult[0].usedPrice : 0;

    //queryGetMedicineInfoinStockPrice
    const [inStockPriceResult] = await pool.query(
      queryGetMedicineInfoinStockPrice,
      [fromDate, toDate, hospitalID, toDate, toDate, toDate]
    );

    // Convert the result to a number
    const inStockPrice =
      inStockPriceResult?.length > 0
        ? Number(inStockPriceResult[0].inStockPrice)
        : 0;

    //queryGetMedicineInfoexpiryPrice

    const [expiryPriceResult] = await pool.query(
      queryGetMedicineInfoexpiryPrice,
      [hospitalID, toDate]
    );

    // Convert the result to a number
    const expiryPrice =
      expiryPriceResult?.length > 0
        ? Number(expiryPriceResult[0].expiryPrice)
        : 0;

    const data = {
      usedPrice: usedPrice,
      inStockPrice: inStockPrice,
      expiryPrice: expiryPrice
    };

    return { status: 200, data: data };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const getExpiryProductInfo = async (hospitalID) => {
  try {
    let [response] = await pool.query(queryGetExpiryProductInfo, [hospitalID]);
    return { status: 200, data: response };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const getLowStockProductInfo = async (hospitalID) => {
  try {
    let [response] = await pool.query(queryGetLowStockProductInfo, [
      hospitalID
    ]);

    if (response.length == 0) {
      return { status: 200, data: [] };
    }

    if (response.length > 0) {
      return { status: 200, data: response };
    }
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const getMedicineInventoryPatientsOrderCompletedWithoutReg = async (
  hospitalID,
  startDate,
  endDate
) => {
  try {
    const formattedStartDate = startDate
      ? dayjs(startDate).format("YYYY-MM-DD")
      : null;
    const formattedEndDate = endDate
      ? dayjs(endDate).format("YYYY-MM-DD")
      : null;

    let response;
    if (formattedStartDate && formattedEndDate) {
      [response] = await pool.query(
        queryGetMedicineInventoryPatientsOrderCompletedWithoutRegWithDate,
        [hospitalID, formattedStartDate, formattedEndDate]
      );
    } else {
      [response] = await pool.query(
        queryGetMedicineInventoryPatientsOrderCompletedWithoutReg,
        [hospitalID]
      );
    }

    response = await Promise.all(
      response.map(async (order) => {
        if (order.fileName) {
          const imageURL = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: order.fileName
            }),
            { expiresIn: 300 }
          );

          order.prescriptionURL = imageURL || null;
        }
        return order;
      })
    );

    if (response.length == 0) {
      return { status: 200, data: response };
    }

    return { status: 200, data: response };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const getMedicineInventoryPatientsOrderCompletedWithRegPatient = async (
  hospitalID,
  departmentType,
  startDate,
  endDate
) => {
  try {
    const formattedStartDate = startDate
      ? dayjs(startDate).format("YYYY-MM-DD")
      : null;
    const formattedEndDate = endDate
      ? dayjs(endDate).format("YYYY-MM-DD")
      : null;

    const departmentTypeCondition =
      Number(departmentType) === 2 ? [2, 3] : [Number(departmentType)];
    let response;
    if (formattedStartDate || formattedEndDate) {
      [response] = await pool.query(
        queryGetMedicineInventoryPatientsOrderCompletedWithRegPatientWithDate(
          departmentTypeCondition.length
        ),
        [
          hospitalID,
          ...departmentTypeCondition,
          formattedStartDate,
          formattedEndDate
        ]
      );
    } else {
      [response] = await pool.query(
        queryGetMedicineInventoryPatientsOrderCompletedWithRegPatient(
          departmentTypeCondition.length
        ),
        [hospitalID, ...departmentTypeCondition]
      );
    }

    if (response.length == 0) {
      return { status: 200, data: response };
    }

    response = response
      .map((order) => ({
        ...order,
        paymentDetails: order.paymentDetails ? order.paymentDetails : [],
        medicinesList: order.medicinesList ? order.medicinesList : []
      }))
      .filter(
        (order) =>
          Array.isArray(order.paymentDetails) &&
          order.paymentDetails.length > 0 &&
          parseFloat(order.totalAmount) === parseFloat(order.paidAmount) &&
          Array.isArray(order.medicinesList) &&
          order.medicinesList.length > 0 &&
          order.medicinesList.every(
            (medicine) => medicine.status === "completed"
          )
      );

    return { status: 200, data: response };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const getTestsTaxInvoice = async (hospitalID) => {
  try {
    const querygetTestsTaxInvoice = `select * from testsalepatients where hospitalID=?`;
    let [response] = await pool.query(querygetTestsTaxInvoice, [hospitalID]);

    return { status: 200, data: response };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

module.exports = {
  addPatientMedicineOrder,
  getMedicineInventoryPatientsOrder,
  updatePatientOrderStatus,
  getMedicineInventoryPatientsOrderWithType,
  getDepartmentConsumption,
  getMedicinesInfo,
  getExpiryProductInfo,
  getLowStockProductInfo,
  getMedicineInventoryPatientsOrderCompletedWithoutReg,
  getMedicineInventoryPatientsOrderCompletedWithRegPatient,
  getTestsTaxInvoice
};
