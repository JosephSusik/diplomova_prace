"use client";

import AuthLayout from "@/components/general/AuthLayout";
import { AllBooksDataGrid } from "@/components/general/datagrid/tables/AllBooksDataGrid";

export default function ExplorePage() {
    return (
        <AuthLayout>
            <AllBooksDataGrid />
        </AuthLayout>
    );
}
