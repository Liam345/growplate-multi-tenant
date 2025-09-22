/**
 * Feature Flag Management API
 * 
 * API endpoints for retrieving and updating tenant feature flags
 * 
 * TASK-005: Feature Flag System Implementation
 */

import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { requireTenant } from "~/middleware/tenant";
import { featureService } from "~/lib/features";
import { validateFeatureUpdateRequest } from "~/lib/validation";

/**
 * GET /api/features - Get tenant features
 * Returns the current feature flags for the requesting tenant
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Get tenant from request (TASK-004 dependency)
    const tenant = await requireTenant(request);
    
    // Get features from service
    const features = await featureService.getTenantFeatures(tenant.id);
    
    return json({
      success: true,
      data: features,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Feature retrieval error:", error);
    
    // If it's already a Response (from requireTenant), re-throw it
    if (error instanceof Response) {
      throw error;
    }
    
    return json({
      success: false,
      error: "Failed to retrieve features",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

/**
 * PUT /api/features - Update tenant features
 * Updates feature flags for the requesting tenant
 */
export async function action({ request }: ActionFunctionArgs) {
  // Only allow PUT method
  if (request.method !== "PUT") {
    return json({
      success: false,
      error: "Method not allowed",
      message: "Only PUT method is supported for feature updates"
    }, { status: 405 });
  }

  try {
    // Get tenant from request (TASK-004 dependency)
    const tenant = await requireTenant(request);
    
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return json({
        success: false,
        error: "Invalid JSON",
        message: "Request body must be valid JSON"
      }, { status: 400 });
    }
    
    // Validate request body
    const validation = validateFeatureUpdateRequest(body);
    if (!validation.isValid) {
      return json({
        success: false,
        error: "Validation failed",
        message: validation.error
      }, { status: 400 });
    }
    
    // Update features
    const updatedFeatures = await featureService.updateTenantFeatures(
      tenant.id, 
      validation.features!
    );
    
    return json({
      success: true,
      data: updatedFeatures,
      message: "Features updated successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Feature update error:", error);
    
    // If it's already a Response (from requireTenant), re-throw it
    if (error instanceof Response) {
      throw error;
    }
    
    return json({
      success: false,
      error: "Failed to update features",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

/**
 * OPTIONS /api/features - CORS preflight support
 * Returns allowed methods for this endpoint
 */
export async function options() {
  return new Response(null, {
    status: 200,
    headers: {
      "Allow": "GET, PUT, OPTIONS",
      "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}