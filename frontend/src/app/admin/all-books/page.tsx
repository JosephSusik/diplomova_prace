"use client";

import AuthLayout from "@/components/general/AuthLayout";
import { AllBooksDataGrid } from "@/components/general/datagrid/tables/AllBooksDataGrid";

export default function AdminAllBooksPage() {
    return (
        <AuthLayout requireAdmin>
            <AllBooksDataGrid />
        </AuthLayout>
    );
}
