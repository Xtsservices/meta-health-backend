const priority = {
  Low: 0,
  Medium: 1,
  High: 2
};

const status = {
  Open: 0,
  Paused: 1,
  Closed: 2
};

const closeStatus = {
  success: 1,
  fail: 2
};
const ticketFor = {
  self: 1,
  other: 2
};

module.exports = { priority, status, ticketFor, closeStatus };
