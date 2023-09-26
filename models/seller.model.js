const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { baseStatus } = require("../utils/enumerator");

const schema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    contact_name: {
      type: String,
    },
    contact_number: {
      type: String,
    },
    company_name: {
      type: String,
    },
    address: {
      type: String,
    },
    email: {
      type: String,
    },
    district: {
      type: String,
    },
    state: {
      type: String,
    },
    country: {
      type: String,
    },
    pan: {
      type: String,
    },
    fssai: {
      type: String,
    },
    status: {
      type: String,
      default: baseStatus.pending,
    },
  },
  {
    timestamps: true,
  }
);

schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);

module.exports = mongoose.model("Seller", schema);
