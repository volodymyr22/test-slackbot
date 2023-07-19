const mongoose = require("mongoose");
require("dotenv").config();
const slackConfiguration = require("../slack_configuration.json");

const uri =
  "mongodb+srv://" +
  slackConfiguration.DB_USERNAME +
  ":" +
  slackConfiguration.DB_PASSWORD +
  "@cluster0.etvzruk.mongodb.net/" +
  slackConfiguration.DB_NAME;

const connect = async function () {
  mongoose.connect(uri);
};

const usersSchema = mongoose.Schema(
  {
    _id: String,
    team: { id: String, name: String },
    enterprise: { id: String, name: String },
    user: { token: String, scopes: [String], id: String },
    tokenType: String,
    isEnterpriseInstall: Boolean,
    appId: String,
    authVersion: String,
    bot: {
      scopes: [String],
      token: String,
      userId: String,
      id: String,
    },
  },
  { _id: false }
);

const User = mongoose.model("User", usersSchema);

module.exports = {
  User,
  connect,
};
