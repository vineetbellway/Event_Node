const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { baseStatus } = require("../utils/enumerator");

const schema = new mongoose.Schema(
  {
    banner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Banner",
      required:true
    }, 
    guest_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    description:{
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);

module.exports = mongoose.model("GuestBanner", schema);
