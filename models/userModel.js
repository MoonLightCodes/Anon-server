const userDB = require("mongoose");

const userSchema = userDB.Schema({
  email: {
    type: String,
    required: [true, "Enter Email"],
    unique: [true, "Email ALready Exist"],
  },
  username: {
    type: String,
    required: [true, "Enter Username"],
    unique: [true, "Username ALready Exist"],
  },
  password: {
    type: String,
    required: [true, "Enter Password"],
  },
},{
  timestamps:true
});

module.exports = userDB.model("userDB",userSchema);