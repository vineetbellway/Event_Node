const jwt = require("jsonwebtoken");
const secretKey = "dasoerp";

const generate = (id) => jwt.sign({ id }, secretKey, { expiresIn: "1d" });

const decode = (token) => {
  try {
    return jwt.verify(token, secretKey);
  } catch (error) {
    console.log("decode token catch error"??error.toString());
  }
};

module.exports = {
  generate,
  decode,
};
