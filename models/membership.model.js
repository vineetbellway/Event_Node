const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { baseStatus } = require("../utils/enumerator");

const schema = new mongoose.Schema(
  {
    seller_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "Seller",
      required: true,
    },
    plan_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "SubscriptionPlan",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    txn: {
      type: String,
      required: true,
    },
    end_date: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: baseStatus.active,
    },
    is_event_created_after_renew_plan: {
      type: String,
      default: "0",
    },
  },
  {
    timestamps: true,
  }
);

schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);

module.exports = mongoose.model("Membership", schema);
