const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const schema = new mongoose.Schema(
  {
    payment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItemPayments",
      required: true,
  },
    menu_item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MenuItem",
        required: true,
    },
    event_id: {
        type: mongoose.Schema.Types.ObjectID,
        ref: "EventModel",
        required: true,
    },
    menu_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Menu",
      required: true,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
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
  },
  {
    timestamps: true,
  }
);

schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);

module.exports = mongoose.model("MenuItemBookings", schema);
