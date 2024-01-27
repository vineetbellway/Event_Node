const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { baseStatus } = require("../utils/enumerator");

const schema = new mongoose.Schema(
  {
    booking_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "Booking",
      required: true,
    },
    menu_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Menu",
      required: true,
    },
     payment_id: {
        type: mongoose.Schema.Types.ObjectID,
        ref: "BookingPayments",
    },
    quantity: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);

module.exports = mongoose.model("BookingMenu", schema);
