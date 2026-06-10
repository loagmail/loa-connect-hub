import { redirect } from "next/navigation"

export default function UserPermissionsPage() {
  redirect("/admin/access-config?tab=grants")
}
