const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    }, 
    value: {
      type: mongoose.Schema.Types.String, // Use String data type for large text data
      required: true,
    }, 
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BusinessSettings", schema);
