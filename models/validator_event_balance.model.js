const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const schema = new mongoose.Schema(
  {
        event_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "EventModel",
        },

        validator_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', 
            required: true,
        },

        total_card_booking_difference: {
            type: Number,
        },

        total_upi_booking_difference: {
            type: Number,
        },

        total_cash_booking_difference: {
            type: Number,
        },     

        total_upi_booking_collect_amount: {
            type: Number,
        },
        total_cash_booking_collect_amount: {
            type: Number,
        },
        total_card_booking_collect_amount: {
          type: Number,
        }
    },
      {
        timestamps: true,
      }
  
  
);

schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);

const ValidatorEventBalance = mongoose.model("ValidatorEventBalance", schema);

module.exports = ValidatorEventBalance;
