const express = require("express");
const {
  generateRoom,
  createRoom,
  getChats,
  deleteChats,
  exitChat,
} = require("../controllers/roomControllers");
const verifyToken = require("../middleware/verifyToken");
const router = express.Router();

router.post("/createRoom", verifyToken, createRoom);
router.post("/genRoom", verifyToken, generateRoom);
router.get("/getChats", verifyToken, getChats);
router.put("/deleteChat", verifyToken, deleteChats);
router.put("/exitChat", verifyToken, exitChat);

module.exports = router;
