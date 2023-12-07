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
    uom_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UOM",
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    amount: {
      type: Number,
    },
    total_stock: {
      type: Number,
    },
    stock_left: {
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
  },
  {
    timestamps: true,
  }
);

schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);

module.exports = mongoose.model("Menu", schema);
