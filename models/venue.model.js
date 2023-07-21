const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");

var validateMobile = function (mobile) {
  var re = /^[0-9]{10}$/g;
  return re.test(mobile);
};

const schema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: "Mobile is required",
      validate: [validateMobile, "Please fill a valid Mobile Number"],
      match: [/^[0-9]{10}$/g, "Please fill a valid Mobile Number"],
    },
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
    },
    status: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);
const Venue = mongoose.model("Venue", schema);

module.exports = Venue;
