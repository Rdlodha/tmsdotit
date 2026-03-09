import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdminTaskList({ refreshTrigger }) {
    const { authFetch } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadTasks = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const response = await authFetch(`${API_BASE_URL}/api/admin-tasks/all`);
            if (!response.ok) throw new Error("Failed to load tasks");
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
    }, [loadTasks, refreshTrigger]);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this task?")) return;
        try {
            const response = await authFetch(`${API_BASE_URL}/api/admin-tasks/${id}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Failed to delete");
            setTasks((prev) => prev.filter((t) => t._id !== id));
        } catch (err) {
            alert(err.message);
        }
    };

    const getStatusColor = (status) => {
        if (status === "completed") return "bg-green-100 text-green-800 border-green-300";
        if (status === "in-progress") return "bg-blue-100 text-blue-800 border-blue-300";
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
    };

    if (loading) return <p className="text-sm text-gray-500">Loading tasks...</p>;
    if (error) return <p className="text-sm text-red-500">{error}</p>;
    if (tasks.length === 0) return <p className="text-sm text-gray-500">No tasks assigned yet.</p>;

    return (
        <div className="space-y-3">
            {tasks.map((task) => (
                <div key={task._id} className="border p-4 rounded-lg shadow-sm bg-white relative">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-semibold text-lg">{task.title}</h3>
                            <p className="text-xs text-gray-500">
                                Assigned to: <span className="font-medium text-gray-800">{task.assignedTo?.name}</span> ({task.assignedTo?.email})
                            </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(task.status)}`}>
                            {task.status}
                        </span>
                    </div>

                    {task.description && <p className="text-sm text-gray-600 mb-2">{task.description}</p>}

                    <div className="flex justify-between items-center mt-3">
                        <span className="text-xs text-gray-400">
                            Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : "None"}
                        </span>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(task._id)}>
                            Delete
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}

AdminTaskList.displayName = "AdminTaskList";
