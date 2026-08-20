require("dotenv").config();

const express = require("express");
const cors = require("cors");
 
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const APP_NAME = process.env.APP_NAME || "GymBuddy API";

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    app: APP_NAME,
    environment: process.env.NODE_ENV || "development",
  });
});

app.listen(PORT, () => {
  console.log(`${APP_NAME} läuft auf Port ${PORT}`);
});
