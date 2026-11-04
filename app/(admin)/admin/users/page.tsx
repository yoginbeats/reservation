import { AdminStaffManager } from "@/components/admin-staff-manager";

export const metadata = {
    title: "Staff & User Management | Superlines Admin",
    description: "Manage system access roles, staff credentials, and terminal assignments.",
};

export default function UsersPage() {
    return <AdminStaffManager />;
}
