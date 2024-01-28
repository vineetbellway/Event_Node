const admin_auth = async (req, res, next) => {
  
  if (req.header("email") && req.header("password")) {
    const email = req.header("email");
    const password = req.header("password");

    if (
      email == process.env.ADMIN_EMAIL &&
      password == process.env.ADMIN_PASSWORD
    ) {
      next();
    } else {
      res.status(401).send({
        status: false,
        message: "Unauthorized Access!",
      });
    }
  } else {
    res.status(401).send({
      status: false,
      message: "Access Denied!",
    });
  }
};

module.exports = {admin_auth};
