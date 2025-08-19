const express = require("express");
const {
  generateRoom,
  createRoom,
  getChats,
  deleteChats,
  exitChat,
  uploadToDiskStoarge
} = require("../controllers/roomControllers");
const verifyToken = require("../middleware/verifyToken");
const router = express.Router();
const {upload} = require('../config/multer');

router.post("/createRoom", verifyToken, createRoom);
router.post("/genRoom", verifyToken, generateRoom);
router.get("/getChats", verifyToken, getChats);
router.put("/deleteChat", verifyToken, deleteChats);
router.put("/exitChat", verifyToken, exitChat);
router.post("/photoUpload",verifyToken, upload.single("file"), uploadToDiskStoarge);

module.exports = router;
