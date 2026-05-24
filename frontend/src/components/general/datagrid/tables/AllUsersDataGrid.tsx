import { DataGrid } from "../DataGrid"
import { userColumns } from "../columns/User"
import { useUsers } from "@/hooks/useUsers"

export const AllUsersDataGrid = () => {
    const { data: users, isLoading } = useUsers();
    return (
        <div className="flex flex-col gap-2 max-h-full h-min">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">All Users</h2>
            </div>
            <DataGrid columns={userColumns} data={users ?? []} isLoading={isLoading} />
        </div>
    )
}

