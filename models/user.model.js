const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { baseStatus } = require("../utils/enumerator");

var validateMobile = function (mobile) {
  var re = /^[0-9]{10}$/g;
  return re.test(mobile);
};

const schema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    phone: {
      type: String,
      required: "Mobile is required",
      validate: [validateMobile, "Please fill a valid mobile number"],
      match: [/^[0-9]{10}$/g, "Please fill a valid mobile number"],
    },
    code: {
      type: String,
      required: true,
    },
    code_phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      default: "guest", //guest, seller, validator,admin
    },
    device_type: {
      type: String,
    },
    device_token: {
      type: String,
    },
    fcm_token: {
      type: String,
    },
    status: {
      type: String,
      default: baseStatus.pending,
    },
    email: {
      type: String,
    },
    password: {
      type: String
    },
  },
  {
    timestamps: true,
  }
);

schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);

module.exports = mongoose.model("User", schema);
