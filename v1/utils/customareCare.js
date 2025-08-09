const getUserHospitalIds = async (pool, findUserByID, userID) => {
    const [userResult] = await pool.query(findUserByID, [userID]);
  
    if (userResult.length === 0) {
      throw new Error("No Account Exists");
    }
  
    const user = userResult[0];
    const multiState = user.multiState || [];
    const multiDist = user.multiDist || [];
    const multiCity = user.multiCity || [];
  
    let hospitalQuery = `
      SELECT id FROM hospitals 
      WHERE isDeleted = 0
    `;
    
    const queryParams = [];
  
    if (multiState.length > 0 && !multiState.includes('all')) {
      hospitalQuery += ` AND state IN (${multiState.map(() => '?').join(',')})`;
      queryParams.push(...multiState);
      
      if (multiDist.length > 0 && !multiDist.includes('all')) {
        hospitalQuery += ` AND district IN (${multiDist.map(() => '?').join(',')})`;
        queryParams.push(...multiDist);
        
        if (multiCity.length > 0 && !multiCity.includes('all')) {
          hospitalQuery += ` AND city IN (${multiCity.map(() => '?').join(',')})`;
          queryParams.push(...multiCity);
        }
      }
    }
  
    const [hospitalResults] = await pool.query(hospitalQuery, queryParams);
    return hospitalResults.map(h => h.id);
  };

  module.exports = { getUserHospitalIds };