const { generateMeaningfulPhrase } = require("../utils/generateWord");
const { conversation, allChats, messages } = require("../models/roomModel");
const userDB = require("../models/userModel");
const { model } = require("mongoose");

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
    await userDB.updateOne(
      { _id: id },
      { $pull: { activeChats: convo._id } }
    );

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

