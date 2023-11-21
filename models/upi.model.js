const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const upiSchema = new mongoose.Schema(
  {
    upi_id: {
      type: String,
    },
    seller_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Assuming you have a User model
    },
  },
  {
    timestamps: true,
  }
);

upiSchema.plugin(mongoosePaginate);
upiSchema.plugin(aggregatePaginate);

const UPI = mongoose.model("UPI", upiSchema);

module.exports = UPI;
