const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const { app } = require("../index");
const { messages, conversation } = require("../models/roomModel");
const userDB = require("../models/userModel");

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", async (socket) => {
  const userId = socket.handshake.auth.userId;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return socket.disconnect();
  }

  socket.userId = userId;
  console.log(`User connected: ${userId}`);

  // ⚡ Auto-join all rooms the user is part of
  try {
    const userRooms = await conversation
      .find({ members: userId })
      .select("phrase");
    userRooms.forEach((r) => socket.join(r.phrase));
    console.log(`User ${userId} joined ${userRooms.length} room(s)`);
  } catch (err) {
    console.error("Error fetching user rooms:", err.message);
  }

  // Optional: manual join
socket.on("join_room", async ({ roomPhrase }) => {
  try {
    // Remove this user from unreadUsers if they join the room
    await conversation.findOneAndUpdate(
      { phrase: roomPhrase },
      { $pull: { unreadUsers: socket.userId } }
    );

    // Join the Socket.IO room
    socket.join(roomPhrase);
  } catch (err) {
    console.error("Error joining room:", err.message);
  }
});


  // Sending a message
 socket.on("send_message", async ({ text, images, phrase }) => {
  try {
    const newMsg = await messages.create({
      text,
      images,
      sender: new mongoose.Types.ObjectId(socket.userId),
    });

    const convo = await conversation.findOneAndUpdate(
      { phrase },
      { $push: { messages: newMsg._id } },
      { new: true }
    );

    if (!convo) return;

    // Emit message to everyone in room
    io.to(phrase).emit("newMessage", {
      ...newMsg.toObject(),
      sender: { _id: socket.userId },
      phrase,
    });

    // Update unreadUsers safely
    convo.members.forEach((id) => {
      if (id.toString() !== socket.userId && !convo.unreadUsers.includes(id)) {
        convo.unreadUsers.push(id);
      }
    });
    await convo.save();
  } catch (err) {
    console.error(err.message);
  }
});


  // Leave room manually
  socket.on("leaveRoom", (phrase) => {
    socket.leave(phrase);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${userId}`);
  });
});

module.exports = { server };
