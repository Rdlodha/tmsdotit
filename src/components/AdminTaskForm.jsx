import { useState, useRef, useEffect, useCallback } from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdminTaskForm({ onTaskCreated }) {
    const { authFetch } = useAuth();
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [assignedTo, setAssignedTo] = useState("");
    const [deadline, setDeadline] = useState("");
    const [file, setFile] = useState(null);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [filePreview, setFilePreview] = useState(null);
    const fileInputRef = useRef(null);

    // Fetch users for the assignment dropdown
    const loadUsers = useCallback(async () => {
        try {
            const response = await authFetch(`${API_BASE_URL}/api/admin-tasks/users`);
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
                if (data.length > 0) setAssignedTo(data[0]._id);
            }
        } catch (err) {
            console.error("Failed to load users:", err);
        } finally {
            setLoadingUsers(false);
        }
    }, [authFetch]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!title.trim() || !assignedTo) {
            setError("Task title and assignee are required");
            return;
        }

        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("assignedTo", assignedTo);
        if (deadline) formData.append("deadline", deadline);
        if (file) formData.append("taskImage", file);

        setSaving(true);
        try {
            const response = await authFetch(`${API_BASE_URL}/api/admin-tasks`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                throw new Error(payload.message || "Failed to create task");
            }

            const newTask = await response.json();
            setSuccess("Task successfully assigned!");

            // Reset form
            setTitle("");
            setDescription("");
            setDeadline("");
            setFile(null);
            setFilePreview(null);
            if (fileInputRef.current) fileInputRef.current.value = "";

            // Notify parent to refresh the list
            if (onTaskCreated) onTaskCreated(newTask);
        } catch (err) {
            setError(err.message || "Failed to create task");
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="w-full border p-5 rounded-lg shadow-md bg-white">
            <h2 className="text-xl font-bold mb-4">Assign New Task</h2>

            <form onSubmit={handleSubmit}>
                <Field className="w-full gap-4 mb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Title */}
                        <div className="flex flex-col gap-1 w-full">
                            <label htmlFor="admin-task-title" className="text-sm font-medium">
                                Task Title *
                            </label>
                            <Input
                                type="text"
                                id="admin-task-title"
                                placeholder="e.g. Design Homepage"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        {/* Assign To Dropdown */}
                        <div className="flex flex-col gap-1 w-full">
                            <label htmlFor="admin-task-assignee" className="text-sm font-medium">
                                Assign To *
                            </label>
                            <select
                                id="admin-task-assignee"
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                                disabled={loadingUsers}
                                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loadingUsers ? (
                                    <option>Loading users...</option>
                                ) : users.length === 0 ? (
                                    <option disabled>No users found</option>
                                ) : (
                                    users.map((u) => (
                                        <option key={u._id} value={u._id}>
                                            {u.name} ({u.email})
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="flex flex-col w-full gap-1">
                        <label htmlFor="admin-task-desc" className="text-sm font-medium">
                            Description
                        </label>
                        <Input
                            type="text"
                            id="admin-task-desc"
                            placeholder="Task details..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Image */}
                        <div className="flex flex-col gap-1 w-full">
                            <label htmlFor="admin-task-image" className="text-sm font-medium">
                                Attachment
                            </label>
                            <Input
                                type="file"
                                id="admin-task-image"
                                ref={fileInputRef}
                                accept="image/*,application/pdf"
                                onChange={(e) => {
                                    const selected = e.target.files[0] || null;
                                    setFile(selected);
                                    setFilePreview(selected ? URL.createObjectURL(selected) : null);
                                }}
                            />
                            {filePreview && (
                                <div className="mt-1.5 relative inline-block">
                                    {file?.type === "application/pdf" ? (
                                        <div className="h-12 w-12 flex items-center justify-center rounded-xl ring-1 ring-gray-200 shadow bg-red-50">
                                            <svg className="w-7 h-7 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 17.5h-1v-5h1.8c1.1 0 1.7.6 1.7 1.5s-.6 1.5-1.7 1.5H8.5v2zm0-2.8h.8c.5 0 .8-.3.8-.7s-.3-.7-.8-.7H8.5v1.4zm4.8 2.8h-1.6v-5h1.6c1.4 0 2.2.9 2.2 2.5s-.8 2.5-2.2 2.5zm-.7-.8h.7c.8 0 1.3-.6 1.3-1.7s-.5-1.7-1.3-1.7h-.7v3.4zm5-4.2v.8h-1.8v1.2h1.6v.8h-1.6v2h-1v-4.8h2.8z" /></svg>
                                        </div>
                                    ) : (
                                        <img
                                            src={filePreview}
                                            alt="Preview"
                                            className="h-12 w-12 object-cover rounded-xl ring-1 ring-gray-200 shadow"
                                        />
                                    )}
                                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[9px] font-semibold px-1 rounded-full leading-4">NEW</span>
                                </div>
                            )}
                        </div>

                        {/* Deadline */}
                        <div className="flex flex-col gap-1 w-full">
                            <label htmlFor="admin-task-deadline" className="text-sm font-medium">
                                Deadline
                            </label>
                            <Input
                                type="date"
                                id="admin-task-deadline"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                            />
                        </div>
                    </div>
                </Field>

                {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
                {success && (
                    <div className="mt-3 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-700">
                        {success}
                    </div>
                )}

                <Button type="submit" className="mt-4 w-full" disabled={saving || users.length === 0}>
                    {saving ? "Assigning Task..." : "Assign Task"}
                </Button>
            </form>
        </div>
    );
}

AdminTaskForm.displayName = "AdminTaskForm";
