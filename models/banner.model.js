const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { baseStatus } = require("../utils/enumerator");

const schema = new mongoose.Schema(
  {
    seller_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required:true
    }, 
    image: {
      type: String,
      required:true
    },
    banner_type: {
      type: String,
      required:true
    },   
  },
  {
    timestamps: true,
  }
);

schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);

module.exports = mongoose.model("Banner", schema);
