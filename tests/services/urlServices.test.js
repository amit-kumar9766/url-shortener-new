const {
  fetchLastTenUrlsService,
  createShortenedUrlService,
  shortenBatchUrlsService,
  getUrlByCodeService,
  deleteUrlService,
  editShortCodeService,
  getUserUrlsService,
} = require("../../services/urlServices");

const { Url, User } = require("../../models");

// Mock the models
jest.mock("../../models");

describe("URL Services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchLastTenUrlsService", () => {
    it("should fetch last 10 URLs", async () => {
      const mockUrls = [
        { originalUrl: "https://example.com", shortCode: "abc123" }
      ];

      Url.findAll.mockResolvedValue(mockUrls);

      const result = await fetchLastTenUrlsService();

      expect(Url.findAll).toHaveBeenCalledWith({
        order: [["createdAt", "DESC"]],
        limit: 10,
        attributes: ["originalUrl", "shortCode", "createdAt"],
      });
      expect(result).toEqual(mockUrls);
    });
  });

  describe("createShortenedUrlService", () => {
    const mockUser = { id: 1 };

    it("should return existing URL if already shortened by user", async () => {
      const existingUrl = { shortCode: "abc123" };
      Url.findOne.mockResolvedValue(existingUrl);

      const result = await createShortenedUrlService({
        url: "https://example.com",
        user: mockUser
      });

      expect(result).toEqual({
        reused: true,
        shortCode: "abc123"
      });
    });

    it("should create new URL with generated short code", async () => {
      Url.findOne.mockResolvedValue(null); // No existing URL
      Url.create.mockResolvedValue({ shortCode: "def456" });

      const result = await createShortenedUrlService({
        url: "https://example.com",
        user: mockUser
      });

      expect(Url.create).toHaveBeenCalledWith({
        originalUrl: "https://example.com",
        shortCode: expect.any(String),
        userId: 1,
        expiryDate: null,
      });
      expect(result).toEqual({
        reused: false,
        shortCode: "def456"
      });
    });

    it("should use custom code if provided", async () => {
      Url.findOne
        .mockResolvedValueOnce(null) // No existing URL
        .mockResolvedValueOnce(null); // Custom code available
      Url.create.mockResolvedValue({ shortCode: "custom123" });

      const result = await createShortenedUrlService({
        url: "https://example.com",
        customCode: "custom123",
        user: mockUser
      });

      expect(Url.create).toHaveBeenCalledWith({
        originalUrl: "https://example.com",
        shortCode: "custom123",
        userId: 1,
        expiryDate: null,
      });
      expect(result).toEqual({
        reused: false,
        shortCode: "custom123"
      });
    });

    it("should throw error if custom code already exists", async () => {
      Url.findOne
        .mockResolvedValueOnce(null) // No existing URL
        .mockResolvedValueOnce({ shortCode: "custom123" }); // Custom code taken

      await expect(
        createShortenedUrlService({
          url: "https://example.com",
          customCode: "custom123",
          user: mockUser
        })
      ).rejects.toThrow("Custom short code already in use");
    });

    it("should handle expiry date", async () => {
      Url.findOne.mockResolvedValue(null);
      Url.create.mockResolvedValue({ shortCode: "abc123" });

      const expiryDate = "2025-12-31T23:59:59Z";

      await createShortenedUrlService({
        url: "https://example.com",
        expiryDate,
        user: mockUser
      });

      expect(Url.create).toHaveBeenCalledWith({
        originalUrl: "https://example.com",
        shortCode: expect.any(String),
        userId: 1,
        expiryDate: new Date(expiryDate),
      });
    });
  });

  describe("shortenBatchUrlsService", () => {
    const mockUser = { id: 1 };

    it("should return error for empty URLs array", async () => {
      const result = await shortenBatchUrlsService({ urls: [], user: mockUser });

      expect(result).toEqual({
        error: "Provide a non-empty URLs array",
        status: 400
      });
    });

    it("should process batch URLs successfully", async () => {
      const urls = [
        { url: "https://example1.com" },
        { url: "https://example2.com" }
      ];

      // Mock the createShortenedUrlService calls
      const originalService = require("../../services/urlServices");
      jest.spyOn(originalService, "createShortenedUrlService")
        .mockResolvedValueOnce({ reused: false, shortCode: "abc123" })
        .mockResolvedValueOnce({ reused: true, shortCode: "def456" });

      const result = await shortenBatchUrlsService({ urls, user: mockUser });

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({
        url: "https://example1.com",
        shortCode: "abc123",
        reused: false
      });
      expect(result.results[1]).toEqual({
        url: "https://example2.com",
        shortCode: "def456",
        reused: true
      });
    });

    it("should handle errors in batch processing", async () => {
      const urls = [
        { url: "https://example1.com" },
        { url: "" } // Invalid URL
      ];

      const originalService = require("../../services/urlServices");
      jest.spyOn(originalService, "createShortenedUrlService")
        .mockResolvedValueOnce({ reused: false, shortCode: "abc123" });

      const result = await shortenBatchUrlsService({ urls, user: mockUser });

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({
        url: "https://example1.com",
        shortCode: "abc123",
        reused: false
      });
      expect(result.results[1]).toEqual({
        url: "",
        error: "Missing or empty URL"
      });
    });
  });

  describe("getUrlByCodeService", () => {
    it("should return original URL for valid code", async () => {
      const mockUrl = {
        originalUrl: "https://example.com",
        expiryDate: null,
        password: null
      };

      Url.findOne.mockResolvedValue(mockUrl);

      const result = await getUrlByCodeService({ code: "abc123" });

      expect(result).toBe("https://example.com");
    });

    it("should throw error for non-existent code", async () => {
      Url.findOne.mockResolvedValue(null);

      await expect(
        getUrlByCodeService({ code: "nonexistent" })
      ).rejects.toThrow("Short code not found");
    });

    it("should throw error for expired URL", async () => {
      const mockUrl = {
        originalUrl: "https://example.com",
        expiryDate: new Date("2020-01-01"),
        password: null
      };

      Url.findOne.mockResolvedValue(mockUrl);

      await expect(
        getUrlByCodeService({ code: "expired" })
      ).rejects.toThrow("Short URL has expired");
    });

    it("should throw error for incorrect password", async () => {
      const mockUrl = {
        originalUrl: "https://example.com",
        expiryDate: null,
        password: "secret123"
      };

      Url.findOne.mockResolvedValue(mockUrl);

      await expect(
        getUrlByCodeService({ code: "protected", password: "wrong" })
      ).rejects.toThrow("Incorrect password");
    });

    it("should return URL with correct password", async () => {
      const mockUrl = {
        originalUrl: "https://example.com",
        expiryDate: null,
        password: "secret123"
      };

      Url.findOne.mockResolvedValue(mockUrl);

      const result = await getUrlByCodeService({
        code: "protected",
        password: "secret123"
      });

      expect(result).toBe("https://example.com");
    });
  });

  describe("deleteUrlService", () => {
    it("should delete URL successfully", async () => {
      const mockUrl = {
        shortCode: "abc123",
        userId: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };

      Url.findOne.mockResolvedValue(mockUrl);

      await deleteUrlService({ code: "abc123", userId: 1 });

      expect(mockUrl.destroy).toHaveBeenCalled();
    });

    it("should throw error if URL not found", async () => {
      Url.findOne.mockResolvedValue(null);

      await expect(
        deleteUrlService({ code: "nonexistent", userId: 1 })
      ).rejects.toThrow("URL not found");
    });
  });

  describe("editShortCodeService", () => {
    const mockUser = { id: 1 };

    it("should update expiry date successfully", async () => {
      const mockUrl = {
        shortCode: "abc123",
        userId: 1,
        expiryDate: new Date(),
        save: jest.fn().mockResolvedValue(true)
      };

      Url.findOne.mockResolvedValue(mockUrl);

      const result = await editShortCodeService({
        shortCode: "abc123",
        expiryDate: "2025-12-31",
        user: mockUser
      });

      expect(mockUrl.save).toHaveBeenCalled();
      expect(result).toEqual({
        message: "Short code updated",
        shortCode: "abc123"
      });
    });

    it("should throw error if URL not found", async () => {
      Url.findOne.mockResolvedValue(null);

      await expect(
        editShortCodeService({
          shortCode: "nonexistent",
          expiryDate: "2025-12-31",
          user: mockUser
        })
      ).rejects.toThrow("Short code not found or not owned by user");
    });
  });

  describe("getUserUrlsService", () => {
    it("should return user URLs", async () => {
      const mockUrls = [
        { originalUrl: "https://example.com", shortCode: "abc123" }
      ];

      Url.findAll.mockResolvedValue(mockUrls);

      const result = await getUserUrlsService({ id: 1 });

      expect(Url.findAll).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: [["createdAt", "DESC"]],
      });
      expect(result).toEqual(mockUrls);
    });
  });
}); 