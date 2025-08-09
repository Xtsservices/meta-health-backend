const pool = require("../db/conn");
const { schema } = require("../helper/validators/wardValidator");

const {
  queryExistingWards,
  insertWards,
  getByID,
  getAll,
  getAllWardsWithUserCount,
  updateWard,
  deleteWard,
  queryPatientDistribution,
  queryPatientDistributionForStaff
} = require("../queries/wardQueries");

async function getAllWards(hospitalID) {
  try {
    const results = await pool.query(getAllWardsWithUserCount, [hospitalID]);
    return results;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function addWards(hospitalID, wards) {
  try {
    // Check for existing wards

    console.log("wardsop", wards);
    const wardCombinations = wards.map((ward) => [
      ward.name,
      ward.floor,
      ward.room
    ]);

    // Execute the query
    const [existingWards] = await pool.query(queryExistingWards, [
      hospitalID,
      wardCombinations
    ]);

    if (existingWards?.length > 0) {
      return {
        error: "one or more wards with the same name,floor and room exist"
      };
    }

    // Validate each ward in the list
    const validatedWards = await Promise.all(
      wards.map(async (ward) => {
        return await schema.validateAsync(ward);
      })
    );
    console.log(
      "========================start wardcheck 3============",
      validatedWards
    );
    const values = validatedWards.map((ward) => [
      hospitalID,
      ward.name ? ward.name.toLowerCase() : "",
      ward.description || "",
      ward.totalBeds || 0,
      ward.totalBeds || 0,
      ward.Attendees || "",
      ward.floor,
      ward.price,
      ward.room,
      JSON.stringify(ward.amenities || []),
      ward.location
    ]);

    // const values = validatedWards.map((ward) => [
    //   hospitalID,
    //   ward.name.toLowerCase(),
    //   ward.description,
    //   ward.totalBeds,
    //   ward.totalBeds,
    // ]);

    // Insert all wards into the database
    console.log(values, "values============4==============");

    const result = await pool.query(insertWards, [values]);
    let count = result[0].insertId - 1;

    const response = validatedWards.map((ward) => {
      count += 1;
      return {
        id: count,
        name: ward.name,
        description: ward.description,
        totalBeds: ward.totalBeds,
        availableBeds: ward.totalBeds,
        Attendees: ward.Attendees || "",
        floor: ward.floor,
        price: ward.price,
        room: ward.room,
        location: ward.location,
        amenities: ward.amenities
      };
    });

    return response;
  } catch (err) {
    if (err.isJoi === true) {
      return { error: err.message };
    }
    return { error: err.message };
  }
}

async function getPatientCountForAllWards(
  filterType,
  hospitalID,
  categoryFilter,
  month,
  year
) {
  try {
    const getCurrentMonth = () => new Date().getMonth() + 1;
    const getCurrentYear = () => new Date().getFullYear();
    const getCurrentWeek = () => {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(
        now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)
      ); // Adjust to the start of the week (Sunday)

      const days = Math.floor((now - startOfWeek) / (24 * 60 * 60 * 1000));
      return Math.ceil((days + 1) / 7); // Adding 1 to start the count from 1
    };
    const filterValue = {
      month: month || getCurrentMonth(),
      year: year || getCurrentYear(),
      week: getCurrentWeek()
    }[filterType];
    let filterCondition = "";
    if (filterValue !== undefined) {
      if (filterType === "month") {
        filterCondition = `AND MONTH(startTime) = ${filterValue} AND YEAR(startTime) = YEAR(NOW())`;
      } else if (filterType === "week") {
        filterCondition = `AND YEARWEEK(startTime, 1) = YEARWEEK(NOW(), 1)`;
      } else {
        filterCondition = `AND ${filterType}(startTime) = ${filterValue}`;
      }
    }
    const categoryFilterCondition = categoryFilter
      ? `AND p.category = ${categoryFilter}`
      : "";
    const patientsJoin = categoryFilterCondition
      ? "JOIN patients p ON pt.patientID = p.id"
      : "";
    const query = `
    SELECT
      pt.wardID,
      w.name AS wardName,
      COUNT(*) AS patientCount
    FROM
      patientTimeLine pt
    JOIN
      wards w ON pt.wardID = w.id
    ${patientsJoin}
    WHERE
      pt.hospitalID=?
      ${filterCondition}
      ${categoryFilterCondition}
    GROUP BY
      pt.wardID
  `;
    const results = await pool.query(query, [hospitalID]);
    const summary = {};
    results[0].forEach((el) => {
      summary[el.wardName.split(" ").join("_")] = el.patientCount;
    });
    return summary;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function patientDistribution(hospitalID) {
  try {
    const results = await pool.query(queryPatientDistribution, [hospitalID]);

    const summary = {};
    results[0].forEach((el) => {
      summary[el.name] = el.patientCount;
    });

    return summary;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function patientDistributionForStaffDashboard(
  hospitalID,
  role,
  userID,
  selectedWardDataFilter
) {
  try {
    const results = await pool.query(
      queryPatientDistributionForStaff(role, selectedWardDataFilter),
      [hospitalID]
    );

    const summary = [];
    const sum = results[0].reduce(
      (accumulator, currentValue) => accumulator + currentValue?.patientCount,
      0
    );

    results[0].forEach((el) => {
      summary.push({
        ward: el.name,
        percentage: el.patientCount
      });
    });

    return summary;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getWard(hospitalID, id) {
  try {
    const results = await pool.query(getByID, [hospitalID, id]);
    return results;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function updateSingleWardService(hospitalID, id, reqBodyData) {
  const { name, description, addBedCount } = reqBodyData;

  if (!name) throw new Error("missing body");

  try {
    const results = await pool.query(getByID, [hospitalID, id]);
    if (results[0].length == 0) {
      throw new Error("No Ward Found");
    }

    const foundDep = results[0][0];
    foundDep.name = name || foundDep.name;
    foundDep.description = description || foundDep.description;
    foundDep.totalBeds = addBedCount
      ? addBedCount + foundDep.totalBeds
      : foundDep.totalBeds;
    foundDep.availableBeds = addBedCount
      ? addBedCount + foundDep.availableBeds
      : foundDep.availableBeds;
    await pool.query(updateWard, [
      foundDep.name,
      foundDep.description,
      foundDep.totalBeds,
      foundDep.availableBeds,
      hospitalID,
      id
    ]);

    return foundDep;
  } catch (err) {
    if (err.isJoi === true) throw new Error(err.message);
    throw new Error(err.message);
  }
}

async function deleteSingleWard(hospitalID, id) {
  try {
    const results = await pool.query(deleteWard, [hospitalID, id]);
    return results;
  } catch (err) {
    if (err.isJoi === true) throw new Error(err.message);
    throw new Error(err.message);
  }
}

module.exports = {
  getAllWards,
  addWards,
  getPatientCountForAllWards,
  patientDistribution,
  patientDistributionForStaffDashboard,
  getWard,
  updateSingleWardService,
  deleteSingleWard
};
