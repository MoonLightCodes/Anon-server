const express = require("express");
const app = express();
const env = require("dotenv");
env.config();
const cors = require("cors");
require("./config/dbConfig.js");
app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);

app.use("/user", require("./routes/userRoutes"));
app.use("/api", require("./routes/roomRoutes"));

const port = process.env.PORT || 8888;
app.listen(port, () => console.log("server listening on", port));
