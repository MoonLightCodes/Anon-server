const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const { app } = require("../index");
const { messages, conversation } = require("../models/roomModel");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  const userId = socket.handshake.auth.userId;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    console.log("❌ Invalid userId in socket auth");
    return socket.disconnect();
  }

  socket.userId = userId;
  console.log("✅ Socket connected:", socket.id, "UserID:", socket.userId);

  // Join a room by phrase
  socket.on("join_room", ({ roomPhrase }) => {
    if (!roomPhrase) return;
    socket.join(roomPhrase);
    console.log(`📥 Joined room: ${roomPhrase}`);
  });

  // Handle sending a message
  socket.on("send_message", async (data) => {
    try {
      const { text, phrase } = data; // ✅ match frontend

      const senderId = socket.userId;

      if (!text || !senderId || !phrase) {
        console.log("❌ Missing fields");
        return;
      }

      // Create the message
      const newMsg = await messages.create({
        text,
        sender: new mongoose.Types.ObjectId(senderId),
      });

      // Push message to the conversation
      const convo = await conversation.findOneAndUpdate(
        { phrase },
        { $push: { messages: newMsg._id } },
        { new: true }
      );

      if (!convo) {
        console.log("❌ Conversation not found for phrase:", phrase);
        return;
      }

      // Emit to the room
      io.to(phrase).emit("newMessage", {
        _id: newMsg._id,
        text:text,
        sender: { _id: senderId }, // Optionally add more info
        phrase,
        createdAt: newMsg.createdAt,
      });

      console.log(`📤 Message sent to room: ${phrase}`);
    } catch (err) {
      console.error("❌ Error in send_message:", err.message);
    }
  });

  // Leave room (optional)
  socket.on("leaveRoom", (phrase) => {
    socket.leave(phrase);
    console.log(`👋 Left room: ${phrase}`);
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("❎ Disconnected:", socket.id);
  });
});

module.exports = { server };
