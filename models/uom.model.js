const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const uomSchema = new mongoose.Schema(
  {
    seller_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "Seller",
      required: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

uomSchema.plugin(mongoosePaginate);
uomSchema.plugin(aggregatePaginate);

const UOM = mongoose.model("UOM", uomSchema);

module.exports = UOM;
