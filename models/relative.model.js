const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { baseStatus } = require("../utils/enumerator");

const schema = new mongoose.Schema(
  {
    guest_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "Guest",
      required: true,
    },
    full_name: {
      type: String,
    },
    dob: {
      type: Date,
    },
    dom: {
      type: Date,
    },
    status: {
      type: String,
      default: baseStatus.active,
    },
  },
  {
    timestamps: true,
  }
);

schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);

module.exports = mongoose.model("Relative", schema);
