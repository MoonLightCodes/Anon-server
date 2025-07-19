const express = require("express");
const { generateRoom, createRoom } = require("../controllers/RoomControllers");
const verifyToken = require("../middleware/verifyToken");
const router = express.Router();
 
router.post("/createRoom", createRoom);
router.post("/genRoom", generateRoom);

module.exports = router;
