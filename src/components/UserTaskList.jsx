import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/auth/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
//this is task commponent for dashboard personal tasks 

export default function UserTaskList() {
    const { authFetch } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadTasks = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const response = await authFetch(`${API_BASE_URL}/api/admin-tasks/my`);
            if (!response.ok) throw new Error("Failed to load assigned tasks");
            const data = await response.json();
            setTasks(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [authFetch]);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    const handleStatusChange = async (id, newStatus) => {
        try {
            const response = await authFetch(`${API_BASE_URL}/api/admin-tasks/my/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok) throw new Error("Failed to update status");

            const updatedTask = await response.json();
            setTasks((prev) => prev.map((t) => (t._id === id ? { ...t, status: updatedTask.status } : t)));
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <p className="text-sm text-gray-500">Loading your assigned tasks...</p>;
    if (error) return <p className="text-sm text-red-500">{error}</p>;
    if (tasks.length === 0) return <p className="text-sm text-gray-500">No tasks have been assigned to you.</p>;

    return (
        <div className="space-y-3 " id="usertasklist">
            {tasks.map((task) => (
                <div key={task._id} className="border p-4 rounded-lg shadow-sm bg-white">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className={`font-semibold text-lg ${task.status === "completed" ? "line-through text-gray-500" : ""}`}>
                                {task.title}
                            </h3>
                            <p className="text-xs text-gray-500">
                                Assigned by Admin: <span className="font-medium">{task.assignedBy?.name}</span>
                            </p>
                        </div>

                        <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task._id, e.target.value)}
                            className="text-xs border rounded-md px-2 py-1 outline-none bg-gray-50 focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    {task.description && <p className="text-sm text-gray-600 mb-2">{task.description}</p>}

                    <div className="mt-3">
                        <span className="text-xs text-gray-400">
                            Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : "None"}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

UserTaskList.displayName = "UserTaskList";
