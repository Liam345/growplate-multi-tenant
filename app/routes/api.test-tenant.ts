import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { requireTenant } from "~/middleware/tenant";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const tenant = await requireTenant(request);
    return json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        domain: tenant.domain,
        features: tenant.features
      }
    });
  } catch (error) {
    return json({
      success: false,
      error: "Tenant not found"
    }, { status: 404 });
  }
}
