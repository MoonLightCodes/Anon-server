const db = require("mongoose");

db.connect(
  process.env.MONGOOSE_CONNECTION_STRING
);

db.connection.on("connected", () => console.log("DATA BASE CONNECTED"));
