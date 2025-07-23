const asyncHandler = require("express-async-handler");
const userDB = require("../models/userModel");
const hasher = require("bcryptjs");
const jwt = require("jsonwebtoken");

//@discpriton user registration
//@path /user/register
//@method POST
//@type public
const userRegister = asyncHandler(async (req, res) => {
  const { password, username } = req.body;
  if (!password || !username) {
    return res.status(400).json({ message: "All fields are mandatory" });
  }

  const foundUserByUsername = await userDB.findOne({ username });
  if (foundUserByUsername) {
    return res.status(400).json({ message: "User already exist" });
  }

  const hashedPassword = await hasher.hash(password, 10);
  const user = await userDB.create({
    password: hashedPassword,
    username,
  });
  if (!user) {
    return res.status(400).json({ message: "Can't register user" });
  }
  res.status(200).json({ username: user.username });
});

//@discpriton user Login
//@path /user/login
//@method POST
//@type public
const userLogin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "All fields are mandatory" });
  }
  const findUser = await userDB.findOne({ username });
  if (!findUser) {
    return res.status(400).json({ message: "No User Found!" });
  }
  if (await hasher.compare(password, findUser.password)) {
    const accessToken = jwt.sign(
      {
        user: {
          username: findUser.username,
          id: findUser.id,
        },
      },
      process.env.accessTokenSecret,
      {
        expiresIn: "100m",
      }
    );

    res
      .status(200)
      .json({
        token: accessToken,
        activeChats: findUser.activeChats,
        id: findUser.id,
        username: findUser.username,
        message: "Login Successfull",
      });
  } else {
    return res.status(400).json({ message: "Invalid UserName or Password" });
  }
});

module.exports = { userRegister, userLogin };
