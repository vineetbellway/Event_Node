const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const schema = new mongoose.Schema(
  {
    event_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventModel",
      required: true,
    },

    validator_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming you have a User model
        required: true,
    },

    total_card_booking_difference: {
        type: String,
    },

    total_upi_booking_difference: {
        type: String,
    },

    total_cash_booking_difference: {
        type: String,
    },
  },
  {
    timestamps: true,
  }
);

schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);

const ValidatorEventBalance = mongoose.model("ValidatorEventBalance", schema);

module.exports = ValidatorEventBalance;
