// protect.js

const asyncHandler = require("express-async-handler");
const { User } = require("../models/userModel.js");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const { isTokenBlacklisted, blacklistToken } = require("../config/generateToken.js"); // Correct import

// const protect = asyncHandler(async (req, res, next) => {
//   let token;

//   try {
//     if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
//       token = req.headers.authorization.split(" ")[1];
//       // Check if the token is blacklisted
//       if (isTokenBlacklisted(token)) {
//         return res.status(200).json({
//           message: "Token is expired or invalid",
//           status: false,
//           expired: true,
//         });
//       }

//       // Decode token id
//       console.log(token);
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       const user = await User.findById(decoded._id).select("-password");
//        console.log("user", user);
//       if (user.deleted_at) {
//         res.status(401).json({
//           message: "Admin has deactive you please contact admin",
//           type: "deactive",
//           status: false,
//         });
//       }
//       req.headers.userID = decoded._id;
//       req.headers.role = decoded.role;
//       req.user = user;
//       next();
//     }
//   } catch (error) {
//     console.error("Protect middleware error:", error.message);
//     res.status(401).json({
//       message: "Not authorized, token failed",
//       status: false,
//     });
//   }

//   if (!token) {
//     res.status(401).json({
//       message: "Not authorized, no token",
//       status: false,
//     });
//   }
// });

const protect = asyncHandler(async (req, res, next) => {
  let token;
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
      console.log("token:-", token);
      // Check if the token is blacklisted
      if (isTokenBlacklisted(token)) {
        return res.status(401).json({
          message: "Token is expired or invalid",
          status: false,
          expired: true,
        });
      }

      // Decode token
      console.log("secret", process.env.JWT_SECRET);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded token:", decoded);
      const userId = decoded._id || decoded.id;

      const user = await User.findById(userId).select("-password");
      console.log("user:-", user);
      if (!user) {
        return res.status(401).json({
          message: "User not found",
          status: false,
        });
      }

      if (user.deleted_at !== null) {
        return res.status(401).json({
          message: "Admin has deactivated your account, please contact admin",
          type: "deactive",
          status: false,
        });
      }

      req.user = user;
      req.headers.userID = userId;
      req.headers.role = decoded.role;
      console.log("Role from token:", decoded.role);
      return next();
    } else {
      return res.status(401).json({
        message: "Not authorized, no token provided",
        status: false,
      });
    }
  } catch (error) {
    console.error("Protect middleware error:", error.message);
    return res.status(401).json({
      message: "Not authorized, token verification failed",
      status: false,
    });
  }
});



module.exports = protect;
