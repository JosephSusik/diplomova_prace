import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

export type User = {
    id: string;
    email: string;
    name: string;
    surname: string;
    role: string;
    createdAt: string;
};

export const userColumns: ColumnDef<User>[] = [
    {
        accessorKey: "email",
        header: "Email",
    },
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "surname",
        header: "Surname",
    },
    {
        accessorKey: "role",
        header: "Role",
    },
    {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => {
            const date = row.getValue("createdAt") as string;
            if (!date) return null;
            try {
                return format(new Date(date), "dd.MM.yyyy");
            } catch {
                return null;
            }
        },
    },
];

