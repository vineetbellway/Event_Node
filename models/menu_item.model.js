const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { baseStatus } = require("../utils/enumerator");

const schema = new mongoose.Schema(
  {
    menu_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "Menu",
      required: true,
    },
    event_id: {
        type: mongoose.Schema.Types.ObjectID,
        ref: "EventModel",
        required: true,
    },
    guest_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
  },
  {
    timestamps: true,
  }
);

schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);

module.exports = mongoose.model("MenuItem", schema);
