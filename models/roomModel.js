const mongoose = require("mongoose");
const { Schema, Types, model } = mongoose;
const conversationSchema = new Schema(
  {
    phrase: {
      type: String,
      required: [true, "Phrase required"],
      unique: [true, "Phrase already in use"],
    },
    members: [{ type: Types.ObjectId, ref: "userDB" }],
    messages: [{ type: Types.ObjectId, ref: "messages" }],
  },
  { timestamps: true }
);

const conversation = model("conversation", conversationSchema);

const messageSchema = new Schema(
  {
    text: { type: String },
    sender: {
      type: Types.ObjectId,
      ref: "userDB",
      required: [true, "sender is unknown"],
    },
  },
  { timestamps: true }
);
const messages = model("messages", messageSchema);
const allActiveChats = new Schema(
  {
    phrase: {
      type: String,
      required: [true, "Phrase required"],
      unique: [true, "Phrase already in use"],
    },
    pass: { type: String },
  },
  { timestamps: true }
);
const allChats = model("allChats", allActiveChats);
module.exports = { messages, conversation, allChats };
