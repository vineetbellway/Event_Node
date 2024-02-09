const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { baseStatus } = require("../utils/enumerator");


const schema = new mongoose.Schema(
  {
    
    validator_id: {
        type: mongoose.Schema.Types.ObjectID,
        ref: "User",
    },
    amount: {
        type: Number,
    },
    status: {
        type: String,
        default: baseStatus.pending,
    },

   /* booking_id: {
        type: mongoose.Schema.Types.ObjectID,
        ref: "Booking",
        required: true,
    },*/
    payment_mode: {
      type: String,
    },
    transaction_id:{
        type: String,
    },
    is_consumed: {
      type: String,
      enum: ['yes', 'no'],
      default: 'no' 
    }
    
  },
  {
    timestamps: true,
  }
);

schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);

module.exports = mongoose.model("BookingPayments", schema);
