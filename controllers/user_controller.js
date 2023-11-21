const User = require("../models/user.model");
const { baseStatus, userStatus } = require("../utils/enumerator");

//multer
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images/user_images");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      new Date().toISOString().replace(/:/g, "-") +
        "." +
        req.params.id +
        "." +
        file.mimetype.split("/")[1]
    );
  },
});

exports.login = async (req, res, next) => {
  let phone = req.body.phone;
  let code = req.body.code;
  let device_type = req.body.device_type;
  let device_token = req.body.device_token;
  if (!phone) {
    return res.status(400).send({
      status: false,
      message: "body phone missing",
    });
  } else if (!code) {
    return res.status(400).send({
      status: false,
      message: "body code missing",
    });
  } else
    try {
      const userModel = await User.findOne({ phone: phone, code: code , device_type: device_type, device_token: device_token });
      if (userModel) {
        return res.send({
          status: true,
          message: "Login Success",
          data: userModel,
        });
      } else {

        const user = new User({
        /*uid: req.uid,*/
          phone: phone,
          code: code,
          code_phone: code + phone,
          device_type: device_type,
          device_token: device_token,
        });
        try {
          await user.save();
          return res
            .status(201)
            .send({ status: true, message: "Sign-Up Success", data: user });
        } catch (error) {
          console.log("aaa9",error);
          return res
            .status(500)
            .send({ status: false, message: error.toString() });
        }
      }
    } catch (error) {
      if (error) {
        return res
          .status(500)
          .send({ status: false, message: error.toString() });
      } else {
        return res
          .status(500)
          .send({ status: false, message: "Internal Server Error" });
      }
    }
};

exports.get_users = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || userStatus.active;

    const myCustomLabels = {
      totalDocs: "totalDocs",
      docs: "data",
      limit: "limit",
      page: "page",
      nextPage: "nextPage",
      prevPage: "prevPage",
      totalPages: "totalPages",
      pagingCounter: "slNo",
      meta: "paginator",
    };

    const options = {
      page: page,
      limit: limit,
      customLabels: myCustomLabels,
      // populate: "user_id",
    };
    await User.paginate({}, options)
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

exports.delete_user = async (req, res) => {
  var id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      await User.deleteOne({ _id: id })
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

exports.delete_users = async (req, res) => {
  try {
    await User.deleteMany()
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

exports.delete_user = async (req, res, next) => {
  var id = req.params.id;
  if (!id) {
    return res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      await User.findOneAndUpdate(
        { _id: id },
        { status: userStatus.deleted },
        { new: true }
      )
        .then((user) => {
          if (user) {
            res.status(200).send({
              status: true,
              message: "user deleted",
            });
          } else {
            res.status(400).send({
              status: false,
              message: "deletion failed",
            });
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
