const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const schema = new mongoose.Schema(
  {
    
    validator_id: {
        type: mongoose.Schema.Types.ObjectID,
        ref: "User",
    },
    menu_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "Menu",
    },
    event_id: {
        type: mongoose.Schema.Types.ObjectID,
        ref: "EventModel",
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

module.exports = mongoose.model("ValidatorQuantity", schema);
