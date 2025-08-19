const { generateMeaningfulPhrase } = require("../utils/generateWord");
const { conversation, allChats, messages } = require("../models/roomModel");
const userDB = require("../models/userModel");
const cloudinary = require("../config/cloudinary");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp")

const activeChats = new Map();
const fillActiveChats = async () => {
  try {
    const allChatingsFromDb = await allChats.find();
    allChatingsFromDb.forEach((e) => {
      activeChats.set(e.phrase, { roomPass: e.pass });
    });
  } catch (err) {
    throw new Error(err);
  }
};
fillActiveChats();
exports.generateRoom = async (req, res) => {
  const { roomPass } = req.body;
  const phrase = generateMeaningfulPhrase(activeChats);
  activeChats.set(phrase, { roomPass: roomPass ?? "" });
  try {
    await allChats.create({
      phrase,
      pass: roomPass ?? "",
    });
    const con = await conversation.create({ phrase, members: req.user.id });
    await userDB.findByIdAndUpdate(req.user.id, {
      $addToSet: { activeChats: con._id },
    });
  } catch (error) {
    activeChats.delete(phrase);
    return res.status(500).json({ message: "Failed to create room" });
  }
  return res.status(201).json({
    message: "Successfully generated the phrase",
    data: { phrase },
  });
};

exports.createRoom = async (req, res) => {
  const { roomPhrase, roomPass } = req.body;
  const room = activeChats.get(roomPhrase);
  const expectedPass = room?.roomPass ?? "";

  if (!room || expectedPass !== (roomPass ?? "")) {
    return res
      .status(400)
      .json({ message: "Enter valid room phrase or password" });
  }

  try {
    const con = await conversation.findOneAndUpdate(
      { phrase: roomPhrase },
      { $addToSet: { members: req.user.id } },
      { new: true }
    );
    await userDB.findByIdAndUpdate(req.user.id, {
      $addToSet: { activeChats: con._id },
    });

    return res.status(200).json({ message: "Room joined successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to join room" });
  }
};
exports.getChats = async (req, res) => {
  const data = await userDB.findById(req.user.id).populate({
    path: "activeChats",
    model: "conversation",
    populate: [
      {
        path: "messages",
        model: "messages",
        populate: {
          path: "sender", // ✅ This is what was missing
          model: "userDB",
          select: "_id username", // optional: only return what you need
        },
      },
      {
        path: "members",
        model: "userDB",
        select: "_id username", // optional
      },
    ],
  });

  return res.status(200).json({ message: "Room joined successfully", data });
};

exports.deleteChats = async (req, res) => {
  console.log("called delete");
  const { roomPhrase } = req.body;
  const { id } = req.user;
  try {
    const convo = await conversation.findOne({ phrase: roomPhrase });

    // ✅ Fix: Correct condition with proper parentheses
    if (!convo || convo.members[0].toString() !== id) {
      return res.status(401).json({
        message: "Only the room creater can delete this room ask admin",
      });
    }

    // ✅ Fix: Removing chat from all users — pulling by ObjectId not phrase
    await userDB.updateMany(
      { activeChats: convo._id },
      { $pull: { activeChats: convo._id } }
    );

    await messages.deleteMany({ _id: { $in: convo.messages } });
    await conversation.deleteOne({ phrase: roomPhrase });

    return res.status(200).json({ message: "Room Successfully deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.exitChat = async (req, res) => {
  const { roomPhrase } = req.body;
  const { id } = req.user;
  try {
    const convo = await conversation.findOne({ phrase: roomPhrase });

    // ✅ Fix: Check if convo exists first
    if (!convo) {
      return res.status(401).json({
        message: "Room doesn't exist or you are not part of this room",
      });
    }

    // ✅ Fix: Correct member check — convo.members are ObjectIds
    if (!convo.members.some((e) => e.toString() === id)) {
      return res.status(401).json({
        message: "Room doesn't exist or you are not part of this room",
      });
    }

    let flag = convo.members.length === 1;

    // ✅ Fix: Remove room from user's activeChats by _id
    await userDB.updateOne({ _id: id }, { $pull: { activeChats: convo._id } });

    // ✅ Fix: Remove user from members array
    await conversation.updateOne(
      { phrase: roomPhrase },
      { $pull: { members: id } }
    );

    if (flag) {
      await messages.deleteMany({ _id: { $in: convo.messages } });
      await conversation.deleteOne({ _id: convo._id });
    }

    return res.status(200).json({ message: "Room Successfully left" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
exports.uploadToDiskStoarge = async (req, res) => {
  if (!req.file) {
    return sendResponse(res, "No file uploaded");
  }
  console.log("entered upload disk controller");

  try {
    // Step 1: Create user upload directory if not exists
    const uploadDir = path.join(__dirname, "../uploads", req.user.id);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Step 2: Prepare resized file path
    const resizedFileName = `resized-${Date.now()}.jpeg`;
    const resizedFilePath = path.join(uploadDir, resizedFileName);

    // Step 3: Resize and save locally
    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat("jpeg")
      .toFile(resizedFilePath);

    // Step 4: Upload to Cloudinary
    const cloudinaryResult = await cloudinary.uploader.upload(resizedFilePath, {
      folder: `user_uploads/${req.user.id}`,
      resource_type: "image",
    });

    // Step 5: Cleanup local storage (delete folder directly)
    if (fs.existsSync(uploadDir)) {
      fs.rmSync(uploadDir, { recursive: true, force: true });
    }

    // Step 6: Respond with Cloudinary info
    const data = {
      success: true,
      cloudinary: {
        url: cloudinaryResult.secure_url,
        public_id: cloudinaryResult.public_id,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        format: cloudinaryResult.format,
      },
    };

    return res
      .status(200)
      .json({ message: "Photo successfully uploaded", data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "File upload failed" });
  }
};

