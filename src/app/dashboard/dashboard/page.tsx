import { redirect } from "next/navigation";

// Legacy dashboard page — redirect all traffic to /customer/home
// The (dashboard) route group is retained for tower/operations routes
// but this landing page is no longer needed.
export default function DashboardPage() {
  redirect("/zh-CN/customer/home");
}
