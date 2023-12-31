const express = require("express");
const app = express();
const cors = require("cors");

const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();
let path = require("path");
const { MONGO_DB_CONFIG } = require("./config/mongo.config");
const http = require("http");
const Server = http.createServer(app);
Server.timeout = 10000;
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
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("/images"));

// Set up static file serving
app.use('/uploads', express.static('uploads'));

// Sample endpoint for testing
app.get("/api/v1/test", (req, res) => {
  res.json({ message: "This is a test endpoint!" });
});

app.use("/api/v1", require("./routes/app.routes"));
app.use("/admin", require("./routes/admin.routes"));

Server.listen(process.env.PORT || 3000, function () {
  console.log("Ready to go!");
});

module.exports = { Server };
