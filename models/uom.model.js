const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const uomSchema = new mongoose.Schema(
  {
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
