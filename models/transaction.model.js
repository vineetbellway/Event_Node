const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const schema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "User",
    },
    vendor_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "Vendor",
    },
    type: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      default: "active",
    },
    upi_id: {
      type: String,
    },
  },
  {
    timestamps: true,
    strictPopulate: false,
  }
);

schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);

const Payment = mongoose.model("Payment", schema);

module.exports = Payment;
