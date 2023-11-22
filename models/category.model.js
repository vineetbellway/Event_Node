const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const categorySchema = new mongoose.Schema(
  {
    seller_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "Seller",
      required: true,
    },
    name: {
      type: String,
      required : true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.plugin(mongoosePaginate);
categorySchema.plugin(aggregatePaginate);

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
