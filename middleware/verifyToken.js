const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  let token;
  const tokenHead = req.headers.authorization || req.headers.Authorization;
  if (tokenHead && tokenHead.startsWith("Bearer")) {
    token = tokenHead.split(" ")[1];
    jwt.verify(token, process.env.accessTokenSecret, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid Session" });
      }
      req.user = decoded.user;
      next();
    });
  } else {
    return res.status(401).json({ message: "Session Expires Login Again" }); 
  }
};

module.exports = verifyToken;
