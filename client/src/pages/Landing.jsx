import { useTenant } from "../context/TenantContext.jsx";
import EventHome from "./EventHome.jsx";
import PlatformLanding from "./PlatformLanding.jsx";

/**
 * Landing Page Router Component:
 * - Renders EventHome when an active tenant (subdomain) is present.
 * - Renders PlatformLanding when accessing the root platform without a tenant context.
 */
export default function Landing() {
  const { activeTenant } = useTenant();

  return activeTenant ? <EventHome /> : <PlatformLanding />;
}
