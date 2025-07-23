const userDB = require("mongoose");

const userSchema = userDB.Schema(
  {
    username: {
      type: String,
      required: [true, "Enter Username"],
      unique: [true, "Username ALready Exist"],
    },
    password: {
      type: String,
      required: [true, "Enter Password"], 
    },
    activeChats: [{ type: userDB.Types.ObjectId,ref:"conversation" }],
  },
  {
    timestamps: true,
  }
);

module.exports = userDB.model("userDB", userSchema);
