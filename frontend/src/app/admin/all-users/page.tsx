"use client";

import AuthLayout from "@/components/general/AuthLayout";
import { AllUsersDataGrid } from "@/components/general/datagrid/tables/AllUsersDataGrid";

export default function AdminAllUsersPage() {
    return (
        <AuthLayout requireAdmin>
            <AllUsersDataGrid />
        </AuthLayout>
    );
}
