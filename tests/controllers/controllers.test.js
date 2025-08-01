const {
  getLastTenUrls,
  shortenUrl,
  shortenBatch,
  redirectUrl,
} = require("../../controllers/urlControllers");
const { mockRequest, mockResponse } = require("./mocker");
const { Url, User } = require("../../models");
const { generateShortUrl } = require("../../utils");

// Mock the Url and User models
jest.mock("../../models", () => ({
  Url: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
  User: {
    findOne: jest.fn(),
  },
}));

jest.mock("crypto", () => ({
  randomBytes: jest.fn(() => Buffer.from("abcdef", "hex")),
}));

jest.mock("../../utils");

describe("getLastTenUrls Controller", () => {
  it("should return the last 10 URLs", async () => {
    const mockUrls = Array.from({ length: 10 }, (_, i) => ({
      originalUrl: `https://example.com/${i + 1}`,
      shortCode: `short${i + 1}`,
      createdAt: new Date(),
    }));

    Url.findAll.mockResolvedValue(mockUrls);

    const req = mockRequest();
    const res = mockResponse();

    await getLastTenUrls(req, res);

    expect(Url.findAll).toHaveBeenCalledWith({
      order: [["createdAt", "DESC"]],
      limit: 10,
      attributes: ["originalUrl", "shortCode", "createdAt"],
    });
    expect(res.json).toHaveBeenCalledWith(mockUrls);
  });

  it("should handle errors and return 500", async () => {
    Url.findAll.mockRejectedValue(new Error("DB error"));

    const req = mockRequest();
    const res = mockResponse();

    await getLastTenUrls(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});

describe("shortenUrl Controller", () => {
  const mockDateNow = new Date("2025-01-01T00:00:00Z").getTime();

  beforeAll(() => {
    jest.spyOn(global.Date, "now").mockImplementation(() => mockDateNow);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("should return 400 if URL is missing", async () => {
    const req = mockRequest();
    const res = mockResponse();
    req.body = {};
    req.headers = { api_key: "123" };

    await shortenUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Missing or empty URL" });
  });

  it("should return 401 if API key is missing", async () => {
    const req = mockRequest();
    const res = mockResponse();
    req.body = { url: "https://example.com" };
    req.headers = {};

    await shortenUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "API key required" });
  });

  it("should return 403 if API key is invalid", async () => {
    const req = mockRequest();
    const res = mockResponse();
    req.body = { url: "https://example.com" };
    req.headers = { api_key: "invalid" };

    User.findOne.mockResolvedValue(null);

    await shortenUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid API key" });
  });

  it("should return existing short URL if already shortened", async () => {
    const req = mockRequest();
    const res = mockResponse();
    req.body = { url: "https://example.com" };
    req.headers = { api_key: "validKey" };

    User.findOne.mockResolvedValue({ id: 1 });
    Url.findOne.mockResolvedValue({ shortUrl: "abc123" });

    await shortenUrl(req, res);

    expect(res.json).toHaveBeenCalledWith({ shortUrl: "abc123" });
  });

  it("should create a new short URL if not found", async () => {
    const req = mockRequest();
    const res = mockResponse();
    req.body = { url: "https://example.com" };
    req.headers = { api_key: "validKey" };

    User.findOne.mockResolvedValue({ id: 1 });
    Url.findOne.mockResolvedValue(null);
    Url.create.mockResolvedValue({ shortUrl: "abcdef" });

    await shortenUrl(req, res);

    expect(Url.create).toHaveBeenCalledWith({
      originalUrl: "https://example.com",
      shortUrl: "abcdef",
      userId: 1,
      expiryDate: null,
    });
    expect(res.json).toHaveBeenCalledWith({ shortUrl: "abcdef" });
  });

  it("should create with expiry date if provided", async () => {
    const req = mockRequest();
    const res = mockResponse();
    const expiry = new Date("2025-12-01T00:00:00.000Z").toISOString();

    req.body = { url: "https://example.com", expiryDate: expiry };
    req.headers = { api_key: "validKey" };

    User.findOne.mockResolvedValue({ id: 1 });
    Url.findOne.mockResolvedValue(null);
    Url.create.mockResolvedValue({ shortUrl: "abcdef" });

    await shortenUrl(req, res);

    expect(Url.create).toHaveBeenCalledWith({
      originalUrl: "https://example.com",
      shortUrl: "abcdef",
      userId: 1,
      expiryDate: new Date(expiry),
    });
    expect(res.json).toHaveBeenCalledWith({ shortUrl: "abcdef" });
  });

  it("should return 409 if customCode already exists", async () => {
    const req = mockRequest();
    const res = mockResponse();

    req.body = {
      url: "https://example.com",
      customCode: "mycode",
    };
    req.headers = { api_key: "validKey" };

    User.findOne.mockResolvedValue({ id: 1 });
    Url.findOne
      .mockResolvedValueOnce(null) // no existing original URL
      .mockResolvedValueOnce({ shortUrl: "mycode" }); // custom code exists

    await shortenUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: "Custom short code already in use",
    });
  });

  it("should create short URL using provided customCode", async () => {
    const req = mockRequest();
    const res = mockResponse();

    req.body = {
      url: "https://example.com",
      customCode: "custom123",
    };
    req.headers = { api_key: "validKey" };

    User.findOne.mockResolvedValue({ id: 1 });
    Url.findOne
      .mockResolvedValueOnce(null) // no original URL
      .mockResolvedValueOnce(null); // customCode not used
    Url.create.mockResolvedValue({ shortUrl: "custom123" });

    await shortenUrl(req, res);

    expect(Url.create).toHaveBeenCalledWith({
      originalUrl: "https://example.com",
      shortUrl: "custom123",
      userId: 1,
      expiryDate: null,
    });

    expect(res.json).toHaveBeenCalledWith({ shortUrl: "custom123" });
  });

  it("should return 500 on unexpected error", async () => {
    const req = mockRequest();
    const res = mockResponse();

    req.body = { url: "https://example.com" };
    req.headers = { api_key: "validKey" };

    User.findOne.mockRejectedValue(new Error("Unexpected error"));

    await shortenUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Could not shorten URL" });
  });
});

describe("shortenBatch controller", () => {
  it("should return 400 if urls array is missing or empty", async () => {
    const req = mockRequest();
    req.body = {}; // urls is missing
    req.headers = { api_key: "validKey" };
    const res = mockResponse();

    await shortenBatch(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Provide a non-empty URLs array",
    });
  });

  it("should return 403 if API key is invalid", async () => {
    const req = mockRequest();
    req.body = { urls: [{ url: "https://example.com" }] };
    req.headers = { api_key: "invalidKey" };
    const res = mockResponse();

    User.findOne.mockResolvedValue(null); // simulate invalid API key

    await shortenBatch(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid API key",
    });
  });

  it("should return 403 if user is not enterprise tier", async () => {
    const req = mockRequest();
    req.body = { urls: [{ url: "https://example.com" }] };
    req.headers = { api_key: "validKey" };
    const res = mockResponse();

    User.findOne.mockResolvedValue({ id: 1, tier: "free" }); // Not enterprise

    await shortenBatch(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "Bulk URL shortening is available for enterprise users only",
    });
  });

  it("should return shortUrl for each valid URL and error for failures", async () => {
    const req = mockRequest();
    req.body = {
      urls: [{ url: "https://example.com" }, { url: "https://fail.com" }],
    };
    req.headers = { api_key: "enterpriseKey" };
    const res = mockResponse();

    User.findOne.mockResolvedValue({ id: 1, tier: "enterprise" });

    generateShortUrl
      .mockResolvedValueOnce({ shortUrl: "abc123" }) // success
      .mockRejectedValueOnce(new Error("fail")); // failure

    await shortenBatch(req, res);

    expect(res.json).toHaveBeenCalledWith({
      results: [
        { url: "https://example.com", shortUrl: "abc123" },
        { url: "https://fail.com", error: "Failed to shorten" },
      ],
    });
  });
});

describe("redirectUrl Controller", () => {
  beforeEach(() => {
    Url.findOne.mockReset();
  });

  it("should return 400 if code is missing", async () => {
    const req = mockRequest({ query: {} });
    const res = mockResponse();

    await redirectUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Missing code parameter" });
  });

  it("should return 404 if short code is not found", async () => {
    Url.findOne.mockResolvedValue(null);
    const req = mockRequest({ query: { code: "notfound" } });
    const res = mockResponse();

    await redirectUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Short code not found" });
  });

  it("should return 410 if short code is expired", async () => {
    Url.findOne.mockResolvedValue({
      shortUrl: "abc",
      expiryDate: new Date(Date.now() - 10000), // expired
    });

    const req = mockRequest({ query: { code: "abc" } });
    const res = mockResponse();

    await redirectUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(410);
    expect(res.json).toHaveBeenCalledWith({ error: "Short URL has expired" });
  });

  it("should return 403 if password is required but not provided", async () => {
    Url.findOne.mockResolvedValue({
      shortUrl: "abc",
      originalUrl: "https://secret.com",
      password: "secret",
      expiryDate: null,
    });

    const req = mockRequest({ query: { code: "abc" } }); // no password
    const res = mockResponse();

    await redirectUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "Incorrect or missing password",
    });
  });

  it("should return 403 if incorrect password is provided", async () => {
    Url.findOne.mockResolvedValue({
      shortUrl: "abc",
      originalUrl: "https://secret.com",
      password: "secret",
      expiryDate: null,
    });

    const req = mockRequest({ query: { code: "abc", password: "wrong" } });
    const res = mockResponse();

    await redirectUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "Incorrect or missing password",
    });
  });

  it("should return the original URL if everything is valid", async () => {
    Url.findOne.mockResolvedValue({
      shortUrl: "abc",
      originalUrl: "https://valid.com",
      password: "letmein",
      expiryDate: new Date(Date.now() + 10000),
    });

    const req = mockRequest({ query: { code: "abc", password: "letmein" } });
    const res = mockResponse();

    await redirectUrl(req, res);

    expect(res.json).toHaveBeenCalledWith({ url: "https://valid.com" });
  });

  it("should return original URL even if no password is set", async () => {
    Url.findOne.mockResolvedValue({
      shortUrl: "public",
      originalUrl: "https://public.com",
      password: null,
      expiryDate: null,
    });

    const req = mockRequest({ query: { code: "public" } });
    const res = mockResponse();

    await redirectUrl(req, res);

    expect(res.json).toHaveBeenCalledWith({ url: "https://public.com" });
  });

  it("should handle unexpected errors", async () => {
    Url.findOne.mockRejectedValue(new Error("Unexpected"));

    const req = mockRequest({ query: { code: "oops" } });
    const res = mockResponse();

    await redirectUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
  });
});
