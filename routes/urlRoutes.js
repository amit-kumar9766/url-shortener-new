const urlController = require("../controllers/urlControllers");

const routes = (app) => {
  // Get last 10 URLs
  app.get("/api/lastUrls", urlController.getLastTen);

  // Shorten a URL
  app.post("/api/urls/shorten", urlController.shortenUrl);

  // batch shortens
  app.post("/shorten/batch", shortenBatch);

  // Redirect to original URL
  app.get("/api/urls/redirect", urlController.redirectUrl);

  // Delete a URL
  app.delete("/api/urls/:code", urlController.deleteUrl);

  // update URL
  app.put("/url/:shortUrl", urlController.editShortCode);

  //get all urls by user
  app.get("/urls", urlController.getUserUrls);
};

module.exports = routes;
