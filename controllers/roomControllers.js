const { generateMeaningfulPhrase } = require("../utils/generateWord");

const activeChats = new Map();
exports.generateRoom = (req, res) => {
  const { roomPass } = req.body;
  const phrase = generateMeaningfulPhrase(activeChats);
  activeChats.set(phrase, { roomPass: roomPass ?? "" });
  console.log(activeChats.entries());
  return res
    .status(201)
    .json({ message: "successfully generated the phrase", data: { phrase } });
};
exports.createRoom = (req, res) => {
  const { roomPhrase, roomPass } = req.body;
  const room = activeChats.get(roomPhrase);
  const expectedPass = room?.roomPass ?? "";
  if (!room || expectedPass !== (roomPass ?? "")) {
    return res
      .status(400)
      .json({ message: "Enter Valid Room Phrase or Valid Password" });
  }

  return res.status(200).json({ message: "Room joined successfully" });
};
