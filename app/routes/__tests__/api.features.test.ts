/**
 * Integration Tests for Feature Flag API
 * 
 * Tests for the feature flag API endpoints including tenant resolution,
 * request validation, and response format.
 */

import { loader, action } from "../api.features";
import * as tenantMiddleware from "~/middleware/tenant";
import { featureService } from "~/lib/features";

// Mock dependencies
jest.mock("~/middleware/tenant");
jest.mock("~/lib/features");

const mockTenantMiddleware = tenantMiddleware as jest.Mocked<typeof tenantMiddleware>;
const mockFeatureService = featureService as jest.Mocked<typeof featureService>;

describe("Feature Flag API", () => {
  const mockTenant = {
    id: "tenant-123",
    name: "Test Restaurant",
    domain: "test.example.com",
    features: { orders: true, loyalty: false, menu: true }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTenantMiddleware.requireTenant.mockResolvedValue(mockTenant as any);
  });

  describe("GET /api/features (loader)", () => {
    it("should return tenant features successfully", async () => {
      const features = { orders: true, loyalty: false, menu: true };
      mockFeatureService.getTenantFeatures.mockResolvedValue(features);

      const request = new Request("http://test.com/api/features");
      const response = await loader({ request, params: {}, context: {} });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        success: true,
        data: features,
        timestamp: expect.any(String)
      });
      expect(mockTenantMiddleware.requireTenant).toHaveBeenCalledWith(request);
      expect(mockFeatureService.getTenantFeatures).toHaveBeenCalledWith(mockTenant.id);
    });

    it("should handle tenant resolution failure", async () => {
      const tenantError = new Response("Tenant not found", { status: 404 });
      mockTenantMiddleware.requireTenant.mockRejectedValue(tenantError);

      const request = new Request("http://test.com/api/features");

      await expect(loader({ request, params: {}, context: {} }))
        .rejects.toEqual(tenantError);
    });

    it("should handle feature service errors", async () => {
      mockFeatureService.getTenantFeatures.mockRejectedValue(new Error("Database error"));

      const request = new Request("http://test.com/api/features");
      const response = await loader({ request, params: {}, context: {} });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toMatchObject({
        success: false,
        error: "Failed to retrieve features",
        message: "Database error"
      });
    });

    it("should handle unknown errors", async () => {
      mockFeatureService.getTenantFeatures.mockRejectedValue("Unknown error");

      const request = new Request("http://test.com/api/features");
      const response = await loader({ request, params: {}, context: {} });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toMatchObject({
        success: false,
        error: "Failed to retrieve features",
        message: "Unknown error"
      });
    });
  });

  describe("PUT /api/features (action)", () => {
    it("should update features successfully", async () => {
      const requestBody = { features: { orders: true, loyalty: true } };
      const updatedFeatures = { orders: true, loyalty: true, menu: true };
      
      mockFeatureService.updateTenantFeatures.mockResolvedValue(updatedFeatures);

      const request = new Request("http://test.com/api/features", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const response = await action({ request, params: {}, context: {} });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        success: true,
        data: updatedFeatures,
        message: "Features updated successfully",
        timestamp: expect.any(String)
      });
      expect(mockFeatureService.updateTenantFeatures).toHaveBeenCalledWith(
        mockTenant.id,
        { orders: true, loyalty: true }
      );
    });

    it("should reject non-PUT methods", async () => {
      const request = new Request("http://test.com/api/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: { orders: true } })
      });

      const response = await action({ request, params: {}, context: {} });
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data).toMatchObject({
        success: false,
        error: "Method not allowed",
        message: "Only PUT method is supported for feature updates"
      });
    });

    it("should handle invalid JSON in request body", async () => {
      const request = new Request("http://test.com/api/features", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: "invalid json"
      });

      const response = await action({ request, params: {}, context: {} });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        success: false,
        error: "Invalid JSON",
        message: "Request body must be valid JSON"
      });
    });

    it("should handle validation errors", async () => {
      const requestBody = { features: "invalid" };

      const request = new Request("http://test.com/api/features", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const response = await action({ request, params: {}, context: {} });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        success: false,
        error: "Validation failed",
        message: expect.stringContaining("Invalid features object")
      });
    });

    it("should handle missing features in request body", async () => {
      const requestBody = { otherField: "value" };

      const request = new Request("http://test.com/api/features", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const response = await action({ request, params: {}, context: {} });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        success: false,
        error: "Validation failed",
        message: "Features object is required in request body"
      });
    });

    it("should handle empty features object", async () => {
      const requestBody = { features: {} };

      const request = new Request("http://test.com/api/features", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const response = await action({ request, params: {}, context: {} });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        success: false,
        error: "Validation failed",
        message: "No valid features provided for update"
      });
    });

    it("should sanitize and accept partially valid features", async () => {
      const requestBody = { 
        features: { 
          orders: true, 
          invalidFeature: false,
          loyalty: true 
        } 
      };
      const updatedFeatures = { orders: true, loyalty: true, menu: true };
      
      mockFeatureService.updateTenantFeatures.mockResolvedValue(updatedFeatures);

      const request = new Request("http://test.com/api/features", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const response = await action({ request, params: {}, context: {} });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Should only pass valid features to service
      expect(mockFeatureService.updateTenantFeatures).toHaveBeenCalledWith(
        mockTenant.id,
        { orders: true, loyalty: true } // invalidFeature filtered out
      );
    });

    it("should handle tenant resolution failure", async () => {
      const tenantError = new Response("Tenant not found", { status: 404 });
      mockTenantMiddleware.requireTenant.mockRejectedValue(tenantError);

      const request = new Request("http://test.com/api/features", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: { orders: true } })
      });

      await expect(action({ request, params: {}, context: {} }))
        .rejects.toEqual(tenantError);
    });

    it("should handle feature service errors", async () => {
      const requestBody = { features: { orders: true } };
      mockFeatureService.updateTenantFeatures.mockRejectedValue(new Error("Database error"));

      const request = new Request("http://test.com/api/features", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const response = await action({ request, params: {}, context: {} });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toMatchObject({
        success: false,
        error: "Failed to update features",
        message: "Database error"
      });
    });
  });

  describe("OPTIONS /api/features", () => {
    it("should return allowed methods", async () => {
      // Import options function directly
      const apiModule = require("../api.features");
      const response = await apiModule.options();

      expect(response.status).toBe(200);
      expect(response.headers.get("Allow")).toBe("GET, PUT, OPTIONS");
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET, PUT, OPTIONS");
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type");
    });
  });
});