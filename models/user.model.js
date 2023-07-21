const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");

var validateMobile = function (mobile) {
  var re = /^[0-9]{10}$/g;
  return re.test(mobile);
};

const schema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
    },
    full_name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: "Mobile is required",
      validate: [validateMobile, "Please fill a valid Mobile Number"],
      match: [/^[0-9]{10}$/g, "Please fill a valid Mobile Number"],
    },
    code: {
      type: Number,
      required: true,
    },
    code_phone: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    upi_id: {
      type: String,
    },
    status: {
      type: String,
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);
const User = mongoose.model("User", schema);

module.exports = User;
