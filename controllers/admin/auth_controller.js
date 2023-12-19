const User = require("../../models/user.model");
const { baseStatus, userStatus } = require("../../utils/enumerator");


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
