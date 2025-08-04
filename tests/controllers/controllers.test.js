const {
  getLastTenUrls,
  shortenUrl,
  shortenBatch,
  redirectUrl,
  deleteUrl,
  editShortCode,
  getUserUrls,
} = require("../../controllers/urlControllers");
const { mockRequest, mockResponse } = require("./mocker");

// Mock the service functions
jest.mock("../../services/urlServices", () => ({
  fetchLastTenUrlsService: jest.fn(),
  createShortenedUrlService: jest.fn(),
  shortenBatchUrlsService: jest.fn(),
  getUrlByCodeService: jest.fn(),
  deleteUrlService: jest.fn(),
  editShortCodeService: jest.fn(),
  getUserUrlsService: jest.fn(),
}));

const {
  fetchLastTenUrlsService,
  createShortenedUrlService,
  shortenBatchUrlsService,
  getUrlByCodeService,
  deleteUrlService,
  editShortCodeService,
  getUserUrlsService,
} = require("../../services/urlServices");

describe("getLastTenUrls Controller", () => {
  it("should return the last 10 URLs", async () => {
    const mockUrls = Array.from({ length: 10 }, (_, i) => ({
      originalUrl: `https://example.com/${i + 1}`,
      shortCode: `short${i + 1}`,
      createdAt: new Date(),
    }));

    fetchLastTenUrlsService.mockResolvedValue(mockUrls);

    const req = mockRequest();
    const res = mockResponse();

    await getLastTenUrls(req, res);

    expect(fetchLastTenUrlsService).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(mockUrls);
  });

  it("should handle errors and return 500", async () => {
    fetchLastTenUrlsService.mockRejectedValue(new Error("DB error"));

    const req = mockRequest();
    const res = mockResponse();

    await getLastTenUrls(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});

describe("shortenUrl Controller", () => {
  it("should return 400 if URL is missing", async () => {
    const req = mockRequest();
    const res = mockResponse();
    req.body = {};
    req.user = { id: 1 };

    await shortenUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Missing or empty URL" });
  });

  it("should return 201 for new URL creation", async () => {
    const req = mockRequest();
    const res = mockResponse();
    req.body = { url: "https://example.com" };
    req.user = { id: 1 };

    createShortenedUrlService.mockResolvedValue({
      reused: false,
      shortCode: "abc123"
    });

    await shortenUrl(req, res);

    expect(createShortenedUrlService).toHaveBeenCalledWith({
      url: "https://example.com",
      customCode: undefined,
      expiryDate: undefined,
      user: { id: 1 }
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ shortCode: "abc123" });
  });

  it("should return 200 for reused URL", async () => {
    const req = mockRequest();
    const res = mockResponse();
    req.body = { url: "https://example.com" };
    req.user = { id: 1 };

    createShortenedUrlService.mockResolvedValue({
      reused: true,
      shortCode: "abc123"
    });

    await shortenUrl(req, res);

    expect(res.json).toHaveBeenCalledWith({ 
      shortCode: "abc123"
    });
  });

  it("should handle service errors", async () => {
    const req = mockRequest();
    const res = mockResponse();
    req.body = { url: "https://example.com" };
    req.user = { id: 1 };

    createShortenedUrlService.mockRejectedValue(new Error("Service error"));

    await shortenUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Could not shorten URL" });
  });
});

describe("shortenBatch Controller", () => {
  it("should return batch results successfully", async () => {
    const req = mockRequest();
    const res = mockResponse();
    req.body = { urls: [{ url: "https://example.com" }] };
    req.user = { id: 1 };

    shortenBatchUrlsService.mockResolvedValue({
      results: [{ url: "https://example.com", shortCode: "abc123" }]
    });

    await shortenBatch(req, res);

    expect(shortenBatchUrlsService).toHaveBeenCalledWith({
      urls: [{ url: "https://example.com" }],
      user: { id: 1 }
    });
    expect(res.json).toHaveBeenCalledWith({
      results: [{ url: "https://example.com", shortCode: "abc123" }]
    });
  });

  it("should handle service errors", async () => {
    const req = mockRequest();
    const res = mockResponse();
    req.body = { urls: [{ url: "https://example.com" }] };
    req.user = { id: 1 };

    shortenBatchUrlsService.mockResolvedValue({
      error: "Invalid URLs array",
      status: 400
    });

    await shortenBatch(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid URLs array" });
  });

  it("should handle unexpected errors", async () => {
    const req = mockRequest();
    const res = mockResponse();
    req.body = { urls: [{ url: "https://example.com" }] };
    req.user = { id: 1 };

    shortenBatchUrlsService.mockRejectedValue(new Error("Unexpected error"));

    await shortenBatch(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});

describe("redirectUrl Controller", () => {
  it("should return 400 if code is missing", async () => {
    const req = mockRequest({ query: {} });
    const res = mockResponse();

    await redirectUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Missing code parameter" });
  });

  it("should return 400 if password is missing", async () => {
    const req = mockRequest({ query: { code: "abc123" } });
    const res = mockResponse();

    await redirectUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Missing password parameter" });
  });

  it("should return original URL successfully", async () => {
    const req = mockRequest({ query: { code: "abc123", password: "secret" } });
    const res = mockResponse();

    getUrlByCodeService.mockResolvedValue("https://example.com");

    await redirectUrl(req, res);

    expect(getUrlByCodeService).toHaveBeenCalledWith({
      code: "abc123",
      password: "secret"
    });
    expect(res.json).toHaveBeenCalledWith({ url: "https://example.com" });
  });

  it("should handle service errors with status", async () => {
    const req = mockRequest({ query: { code: "abc123" } });
    const res = mockResponse();

    const error = new Error("Short code not found");
    error.status = 404;
    getUrlByCodeService.mockRejectedValue(error);

    await redirectUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Short code not found" });
  });

  it("should handle unexpected errors", async () => {
    const req = mockRequest({ query: { code: "abc123" } });
    const res = mockResponse();

    getUrlByCodeService.mockRejectedValue(new Error("Unexpected error"));

    await redirectUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Unexpected error" });
  });
});

describe("deleteUrl Controller", () => {
  it("should return 400 if code is missing", async () => {
    const req = mockRequest({ params: {} });
    const res = mockResponse();
    req.user = { id: 1 };

    await deleteUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Missing URL code" });
  });

  it("should delete URL successfully", async () => {
    const req = mockRequest({ params: { code: "abc123" } });
    const res = mockResponse();
    req.user = { id: 1 };

    deleteUrlService.mockResolvedValue();

    await deleteUrl(req, res);

    expect(deleteUrlService).toHaveBeenCalledWith({
      code: "abc123",
      userId: 1
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "URL deleted successfully" });
  });

  it("should handle service errors", async () => {
    const req = mockRequest({ params: { code: "abc123" } });
    const res = mockResponse();
    req.user = { id: 1 };

    const error = new Error("URL not found");
    error.status = 404;
    deleteUrlService.mockRejectedValue(error);

    await deleteUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "URL not found" });
  });
});

describe("editShortCode Controller", () => {
  it("should update short code successfully", async () => {
    const req = mockRequest({
      params: { shortCode: "abc123" },
      body: { expiryDate: "2025-12-31" }
    });
    const res = mockResponse();
    req.user = { id: 1 };

    editShortCodeService.mockResolvedValue({
      message: "Short code updated",
      shortCode: "abc123"
    });

    await editShortCode(req, res);

    expect(editShortCodeService).toHaveBeenCalledWith({
      shortCode: "abc123",
      expiryDate: "2025-12-31",
      user: { id: 1 }
    });
    expect(res.json).toHaveBeenCalledWith({
      message: "Short code updated",
      newShortCode: {
        message: "Short code updated",
        shortCode: "abc123"
      }
    });
  });

  it("should handle service errors", async () => {
    const req = mockRequest({
      params: { shortCode: "abc123" },
      body: { expiryDate: "2025-12-31" }
    });
    const res = mockResponse();
    req.user = { id: 1 };

    editShortCodeService.mockRejectedValue(new Error("Service error"));

    await editShortCode(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Service error" });
  });
});

describe("getUserUrls Controller", () => {
  it("should return user URLs successfully", async () => {
    const req = mockRequest();
    const res = mockResponse();
    req.user = { id: 1 };

    const mockUrls = [
      { originalUrl: "https://example.com", shortCode: "abc123" }
    ];
    getUserUrlsService.mockResolvedValue(mockUrls);

    await getUserUrls(req, res);

    expect(getUserUrlsService).toHaveBeenCalledWith({ id: 1 });
    expect(res.json).toHaveBeenCalledWith({ urls: mockUrls });
  });

  it("should handle service errors", async () => {
    const req = mockRequest();
    const res = mockResponse();
    req.user = { id: 1 };

    getUserUrlsService.mockRejectedValue(new Error("Service error"));

    await getUserUrls(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
