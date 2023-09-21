const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { baseStatus } = require("../utils/enumerator");

const schema = new mongoose.Schema(
  {
    guest_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "Guest",
    },
    invitation_type: {
      type: String,
      default: "event", //event, loyalty
    },
    seller_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "Seller",
      required: true,
    },
    event_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "EventModel",
      required: true,
    },
    points: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
    },
    title: {
      type: String,
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

module.exports = mongoose.model("Invitation", schema);
