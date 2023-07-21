const admin = async (req, res, next) => {
  if (req.header("username") && req.header("password")) {
    const username = req.header("username");
    const password = req.header("password");

    if (
      username == process.env.ADMIN_USERNAME &&
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

module.exports = admin;
