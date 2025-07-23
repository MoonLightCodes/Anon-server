const fs = require("fs");
const path = require("path");

module.exports = (req, res, next) => {
  const logText = `TIME:${new Date().toISOString()} METHOD:${req.method} IP:${
    req.ip
  } ENDPOINT:${req.originalUrl}\n`;
  if (!fs.existsSync(path.join(__dirname, "..", "logs"))) {
    fs.mkdirSync(path.join(__dirname, "..", "logs"));
  }
  fs.appendFile(path.join(__dirname, "..", 'logs',"logs.txt"), logText, (e) => {
    if (e) console.err("err found", e);
  });
  next();
};
