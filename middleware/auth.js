const { admin } = require("../configs/firebase.config");

const auth = async (req, res, next) => {
  if (req.header("Authorization")) {
    const token = req.header("Authorization").replace("Bearer", "").trim();
    admin
      .auth()
      .verifyIdToken(token)
      .then(function (decodedToken) {
        req.uid = decodedToken.uid;
        req.phone_number = decodedToken.phone_number;
        next();
      })
      .catch(function (error) {
        res.status(401).send({
          status: false,
          message: error,
        });
      });
  } else {
    res.status(401).send({
      status: false,
      message: "token missing",
    });
  }
};

module.exports = { auth };
