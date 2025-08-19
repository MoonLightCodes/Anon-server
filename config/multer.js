const multer = require("multer");

// Store file in memory (not directly on disk)
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });
module.exports= {upload}