const checkPatientType = (givenType, allowedTypes) => {
  return allowedTypes.includes(givenType);
};

module.exports = { checkPatientType };
