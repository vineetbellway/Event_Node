const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { baseStatus } = require("../utils/enumerator");

const schema = new mongoose.Schema(
  {
    seller_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
    },
    primary_number: {
      type: String,
    },
    secondary_number: {
      type: String,
    },
    type: {
      type: String,
      default: "entry_event", //entry_event, food_event(banquet), entry_food_event, loyalty
    },
    image: {
      type: String,
    },
    name: {
      type: String,
      index: "text",
    },
    venue: {
      type: String,
      index: "text",
    },
    country: {
      type: String,
    },
    state: {
      type: String,
    },
    city: {
      type: String,
    },
    start_time: {
      type: Date,
    },
    end_time: {
      type: Date,
    },
    coupon_name: {
      type: String,
      index: "text",
    },
    amount: {
      type: Number,
    },
    instructions: {
      type: String,
    },
    transportation_charge: {
      type: Number,
    },
    hire_charge: {
      type: Number,
    },
    labour_charge: {
      type: Number,
    },
    commision_charge: {
      type: Number,
    },
    others: {
      type: String,
    },
    is_cover_charge_added: {
      type: String,
      enum: ['yes','no'],
    },
    cover_charge: {
      type: Number,
    },    
    status: {
      type: String,
      default: baseStatus.pending,
    },
    is_closed: {
      type: String,
      default: "no",
    },
    banner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Banner",
      required: false,  
    },
  },
  {
    timestamps: true,
  }
);

schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);

module.exports = mongoose.model("Event", schema);
