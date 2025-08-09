const missingBody = (res, msg) => {
  console.log(msg);
  res.status(400).send({
    error: msg
  });
};

const forbidden = (res, msg) => {
  console.log(msg);
  res.status(403).send({
    error: msg
  });
};

const resourceNotFound = (res, msg) => {
  console.log(msg);
  res.status(404).send({
    error: msg
  });
};

const serverError = (res, msg) => {
  console.log(msg);
  res.status(500).send({
    error: msg
  });
};

const unauthorized = (res, msg) => {
  console.log(msg);
  res.status(401).send({
    error: msg
  });
};

const duplicateRecord = (res, msg) => {
  console.log(msg);
  res.status(409).send({
    error: msg
  });
};

const notAllowed = (res, msg) => {
  console.log(msg);
  res.status(405).send({
    error: msg
  });
};

const tokenExpired = (res, msg) => {
  console.log(msg);
  res.status(405).send({
    error: msg
  });
};
module.exports = {
  missingBody,
  forbidden,
  resourceNotFound,
  serverError,
  unauthorized,
  duplicateRecord,
  notAllowed
};
