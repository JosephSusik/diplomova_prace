"use client";

import AuthLayout from "@/components/general/AuthLayout";
import { MyBooksDataGrid } from "@/components/general/datagrid/tables/MyBooksDataGrid";

export default function MyBooksPage() {
    return (
        <AuthLayout>
            <MyBooksDataGrid />
        </AuthLayout>
    );
}

