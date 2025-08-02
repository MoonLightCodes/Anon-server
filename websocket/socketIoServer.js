const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const { app } = require("../index");
const { messages, conversation } = require("../models/roomModel");

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  const userId = socket.handshake.auth.userId;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return socket.disconnect();
  }

  socket.userId = userId;

  socket.on("join_room", ({ roomPhrase }) => {
    socket.join(roomPhrase);
  });

  socket.on("send_message", async ({ text, phrase }) => {
    try {
      const newMsg = await messages.create({
        text,
        sender: new mongoose.Types.ObjectId(socket.userId),
      });

      const convo = await conversation.findOneAndUpdate(
        { phrase },
        { $push: { messages: newMsg._id } },
        { new: true }
      );

      if (!convo) return;

      io.to(phrase).emit("newMessage", {
        ...newMsg.toObject(),
        sender: { _id: socket.userId },
        phrase,
      });
    } catch (err) {
      console.error(err.message);
    }
  });

  socket.on("leaveRoom", (phrase) => socket.leave(phrase));
});

module.exports = { server };
