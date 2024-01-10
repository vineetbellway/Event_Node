const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const schema = new mongoose.Schema(
  {
    
    validator_id: {
        type: mongoose.Schema.Types.ObjectID,
        ref: "User",
    },
    payment_status: {
        type: "String",
    },
    total_points: {
        type: Number,
    },
    is_approved: {
        type: "String",
    },
  },
  {
    timestamps: true,
  }
);

schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);

module.exports = mongoose.model("ServiceItemPayments", schema);
