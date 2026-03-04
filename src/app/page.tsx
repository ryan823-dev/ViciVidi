import { redirect } from "next/navigation";

export default function Home() {
  // Middleware handles view-mode routing (customer → /c/home, operations → /dashboard)
  redirect("/zh-CN/c/home");
}
