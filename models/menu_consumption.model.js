const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const schema = new mongoose.Schema(
  {
    menu_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Menu",
      required: true,
    },
    guest_id: {
        type: mongoose.Schema.Types.ObjectID,
        ref: "User",
        required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    total_price: {
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

module.exports = mongoose.model("MenuConsumption", schema);
