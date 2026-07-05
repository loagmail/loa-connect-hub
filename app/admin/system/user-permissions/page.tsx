import { redirect } from "next/navigation"

export default function UserPermissionsPage() {
  redirect("/admin/system/access-config?tab=user-permissions")
}
