const mongoose = require("mongoose");

const adminSettingsSchema = new mongoose.Schema({
  signupTicketBalance: {
    type: Number,
  },
  referralTicketBalance: {
    type: Number,
  },
  Referral_Note: {
    type: String,
    default: 0
  },
  Bot_Name: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model("adminSettings", adminSettingsSchema);
