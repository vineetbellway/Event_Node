const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { baseStatus } = require("../utils/enumerator");

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    discount: {
      //do subtract discount from amount
      type: Number,
      required: true,
    },
    days: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      default: baseStatus.active,
    },
    description: {
      type: String,
      required: true,
    },
    event_limit: {
      type: String,
      required: true,
    },
    event_venue_by_google_location: {
      type: String,
    },
    private_events: {
      type: String,
    },
    event_banner_publishing: {
      type: String,
    },
    birthday_banner_publishing: {
      type: String,
    },
    wedding_anniversary_banner_publishing: {
      type: String,
    },
    razor_pay_account_creation: {
      type: String,
    },
    item_sales_report: {
      type: String,
    },
    fns_moving_report: {
      type: String,
    },
    guest_potential_report: {
      type: String,
    },
    repeated_guest_report: {
      type: String,
    },
    profit_loss_and_cover_report: {
      type: String,
    },
    loyaltiy_card_report: {
      type: String,
    },
    feedback_reply_by_guest: {
      type: String,
    }

  },
  {
    timestamps: true,
  }
);

schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);

module.exports = mongoose.model("SubscriptionPlan", schema);
