const User = require("../../models/user.model");
const { baseStatus, userStatus } = require("../../utils/enumerator");
const fs = require("fs");


exports.login = async (req, res, next) => {
  var email = req.body.email;
  var password = req.body.password;

  if (!email) {
    return res.status(400).send({
      status: false,
      message: "email missing",
    });
  } else if (!password) {
    return res.status(400).send({
      status: false,
      message: "password missing",
    });
  } 
  
  else {
    try {
     var admin_email = process.env.ADMIN_EMAIL;
     var admin_password = process.env.ADMIN_PASSWORD;
     if(req.body.email == admin_email && req.body.password == admin_password){
      return res.send({
        status: true,
        message: "Login Success",
        data : {email,password}
      });
     }
       else {
        return res.status(401).send({
          status: false,
          message: "Invalid credentiails",
        });
      }
    } catch (error) {
      console.log("Error:", error);
      return res.status(500).send({
        status: false,
        message: error.toString() || "Internal Server Error",
      });
    }
  }
};



exports.get_user = async (req, res) => {
  var id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      await User.findOne({ _id: id, status: userStatus.active })
        .then((results) => {
          if (results) {
            res
              .status(200)
              .send({ status: true, message: "success", data: results });
          } else {
            res.status(404).send({ status: false, message: "user not found" });
          }
        })
        .catch((error) => {
          res.send({
            status: false,
            message: error.toString() ?? "Error",
          });
        });
    } catch (error) {
      res.status(500).send({
        status: false,
        error: error.toString() ?? "Internal Server Error",
      });
    }
  }
};


exports.update_user = async (req, res, next) => {
  var id = req.params.id;
  if (id) {
    try {
      let user = await User.findOneAndUpdate({ _id: id }, req.body, {
        new: true,
      });
      return res
        .status(201)
        .send({ status: true, message: "Success", data: user });
    } catch (error) {
      return res.status(500).send({ status: false, message: error.toString() });
    }
  } else {
    return res.status(400).send({
      status: false,
      message: "param id missing",
    });
  }
};


exports.add_image = async (req, res, next) => {
  var id = req.params.id;
  if (id) {
    var upload = multer({
      storage: storage,
      limits: {
        fileSize: 1024 * 1024 * 5,
      },
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype == "image/png" ||
          file.mimetype == "image/jpg" ||
          file.mimetype == "image/jpeg" ||
          file.mimetype == "image/pjpeg"
        ) {
          cb(null, true);
        } else {
          cb(null, false);
          return cb(
            new Error("Only .png, .jpg and .jpeg .pjpeg format allowed!")
          );
        }
      },
    }).single("user_image");
    upload(req, res, function (err) {
      if (err) {
        console.log(err.toString());
        return res.status(500).send({
          status: false,
          message: err.toString(),
        });
      } else {
        User.findByIdAndUpdate(
          { _id: id },
          { $set: { photo: `user-${id}.${file.mimetype}` } }
        )
          .then((link) => {
            res.status(200).send({
              status: true,
              message: "images/user_images/" + req.file.originalname,
            });
          })
          .catch((error) => {
            res.send({
              status: false,
              message: error.toString() ?? "Error",
            });
          });
      }
    });
  } else {
    return res.status(400).send({
      status: false,
      message: "param id missing",
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const adminPasswordFromEnv = process.env.ADMIN_PASSWORD;

    // Check if admin password from env is available
    if (!adminPasswordFromEnv) {
      return res.status(500).json({
        status: false,
        message: "Admin password from environment variable not found",
      });
    }

    
    // Check if the current password matches the one in the environment variable
    if (current_password !== adminPasswordFromEnv) {
      return res.status(400).json({
        status: false,
        message: "Current password is incorrect",
      });
    }

    // Update the admin password in the environment variable
    process.env.ADMIN_PASSWORD = new_password;


    // Read the contents of the .env file
    const envFile = fs.readFileSync(".env", "utf8");

    // Replace the old password with the new password in the .env file contents
    const updatedEnvFile = envFile.replace(
      /ADMIN_PASSWORD=.*/,
      `ADMIN_PASSWORD=${new_password}`
    );

    // Write the updated contents back to the .env file
    fs.writeFileSync(".env", updatedEnvFile);

    res.status(200).json({
      status: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.toString() || "Internal Server Error",
    });
  }
};

exports.getProfile = async (req, res) => {  
  try {
    const adminEmailFromEnv = process.env.ADMIN_EMAIL;
    const adminNameFromEnv = process.env.ADMIN_NAME;
    var adminData = {};
    adminData.email = adminEmailFromEnv;
    adminData.name = adminNameFromEnv;
    res.status(200).json({
      status: true,
      message: "Data found successfully",
      data:adminData

    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.toString() || "Internal Server Error",
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { email, name } = req.body;
    const adminEmailFromEnv = process.env.ADMIN_EMAIL;
    const adminNameFromEnv = process.env.ADMIN_NAME;

    // Check if admin email and name from env are available
    if (!adminEmailFromEnv || !adminNameFromEnv) {
      return res.status(500).json({
        status: false,
        message: "Admin email or name from environment variable not found",
      });
    }

   

    // Update the admin email and name in the environment variables
    process.env.ADMIN_EMAIL = email;
    process.env.ADMIN_NAME = name;

    // Read the contents of the .env file
    const envFile = fs.readFileSync(".env", "utf8");

    // Replace the old email with the new email in the .env file contents
    const updatedEnvFile = envFile
      .replace(/ADMIN_EMAIL=.*/, `ADMIN_EMAIL=${email}`)
      .replace(/ADMIN_NAME=.*/, `ADMIN_NAME=${name}`);

    // Write the updated contents back to the .env file
    fs.writeFileSync(".env", updatedEnvFile);

    res.status(200).json({
      status: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.toString() || "Internal Server Error",
    });
  }
};

exports.logout = async (req, res) => {
  try {

    res.status(200).json({
      status: true,
      message: "Logout successful",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.toString() || "Internal Server Error",
    });
  }
};