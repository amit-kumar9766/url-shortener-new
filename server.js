const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config();
const { sequelize } = require("./models");
const routes = require("./routes/urlRoutes");

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Example Routes
app.get("/", (req, res) => {
  res.send("Welcome to the URL Shortener API");
});

// routing
routes(app);

// DB connection test
sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection established successfully.");

    // Start server only after DB is connected
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });
