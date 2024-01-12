const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { baseStatus } = require("../utils/enumerator");

const schema = new mongoose.Schema(
  {
    event_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "EventModel",
      required: true,
    },
    name: {
      type: String,
    },
    point: {
      type: Number,
    },
    is_limited: {
      type: String,
      enum: ['yes','no'],
      required : true
    },
    limited_count:{
      type: Number,
    },
    status: {
      type: String,
      default: baseStatus.active,
    },
    total_stock: {
      type: String,
    },
    validator_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
     // required: true,
    },
  },
  {
    timestamps: true,
  }
);

schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);

module.exports = mongoose.model("Service", schema);
