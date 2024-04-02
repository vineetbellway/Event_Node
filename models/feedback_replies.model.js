const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { baseStatus } = require("../utils/enumerator");

const schema = new mongoose.Schema(
  {
    seller_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "User",
      required: true,
    },

    feedback_id: {
        type: mongoose.Schema.Types.ObjectID,
        ref: "Feedback",
        required: true,
    },   
    message: {
        type: String,
        required: true,
    },    
  },
  {
    timestamps: true,
  }
);

schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);

module.exports = mongoose.model("FeedBackReply", schema);
