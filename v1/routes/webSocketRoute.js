const { WebSocketServer } = require("ws");
const triageWebSocket = require("../controllers/triageWebSocket");
const verifyAccess = require("../middleware/verifyAccess");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const setupWebSocket = (server) => {
  try {
    const wss = new WebSocketServer({
      server,
      path: "/api/v1/triage",
      verifyClient: (info, cb) => {
        const token = info.req.headers["sec-websocket-protocol"];
        if (!token) cb(false, 401, "missing authorization");
        else {
          jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (err) {
              cb(false, 401, err.message);
            } else {
              info.req.user = decoded;
              console.log("client info ", decoded.info);
              cb(true);
            }
          });
        }
      }
    });

    wss.on("connection", (ws) => {
      ws.id = uuidv4();
      console.log("Client connected", ws.id);
      ws.on("error", console.error);
      // Set the connection as alive initially
      // ws.isAlive = true;

      // // Handle pong messages from the client
      // ws.on('pong', () => {
      //   ws.isAlive = true;
      // });

      // // Ping the client every 30 seconds to check if it's still alive
      // const interval = setInterval(() => {
      //   wss.clients.forEach((client) => {
      //     if (!client.isAlive) {
      //       return client.terminate();
      //     }
      //     // Reset the isAlive flag and send a ping
      //     client.isAlive = false;
      //     client.ping();
      //   });
      // }, 30000); // Send a ping every 30 seconds

      ws.on("message", (message) => {
        triageWebSocket.handleMessage(ws, message);
      });

      ws.on("error", (err) => {
        console.log("Client ws err ", err.message, " ", ws.id);
      });
      ws.on("close", () => {
        console.log("Client disconnected", ws.id);
      });
    });
  } catch (err) {
    console.log("Error with websockets ", err.message);
  }
};

module.exports = setupWebSocket;
