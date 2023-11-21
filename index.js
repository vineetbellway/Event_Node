const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
let path = require("path");
const { MONGO_DB_CONFIG } = require("./config/mongo.config");
const http = require("http");
const Server = http.createServer(app);

mongoose.Promise = global.Promise;
mongoose.set("strictQuery", false);
mongoose
  .connect(MONGO_DB_CONFIG.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((res) => {
    console.log("DB Connected");
  })
  .catch((error) => {
    console.log("DB cannot connect : " + error);
  });

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("/images"));
app.use("/api/v1", require("./routes/app.routes"));
Server.listen(process.env.PORT || 3000, function () {
  console.log("Ready to go!");
});

module.exports = { Server };
