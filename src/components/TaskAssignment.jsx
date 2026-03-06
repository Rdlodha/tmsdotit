import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field } from "@/components/ui/field";
import {
    ClipboardList,
    UserCheck,
    Plus,
    Trash2,
    CheckCircle2,
    Circle,
    Clock,
    ChevronDown,
    ChevronRight,
    Users,
    Tag,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ─── Helpers ─────────────────────────────────────────────── */
function statusBadge(status) {
    if (status === "completed")
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
    if (status === "in-progress")
        return "bg-blue-100 text-blue-800 border-blue-300";
    return "bg-amber-100 text-amber-800 border-amber-300";
}

function StatusIcon({ status }) {
    if (status === "completed")
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (status === "in-progress")
        return <Clock className="w-4 h-4 text-blue-500" />;
    return <Circle className="w-4 h-4 text-amber-500" />;
}

/* ─── Personal Tasks Panel (shared by both roles) ─────────── */
function PersonalTasksPanel() {
    const { authFetch } = useAuth();
    const fileInputRef = useRef(null);

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [completed, setCompleted] = useState(false);
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);

    const loadTasks = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${API_BASE_URL}/api/tasks`);
            if (!res.ok) throw new Error("Failed to load personal tasks");
            setTasks(await res.json());
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [authFetch]);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        setFile(selected);
        if (selected) {
            setFilePreview(URL.createObjectURL(selected));
        } else {
            setFilePreview(null);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!title.trim()) return setError("Task name is required");
        const fd = new FormData();
        fd.append("title", title);
        fd.append("description", description);
        fd.append("completed", completed);
        if (file) fd.append("taskImage", file);

        setSaving(true);
        setError("");
        try {
            const res = await authFetch(`${API_BASE_URL}/api/tasks`, {
                method: "POST",
                body: fd,
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Failed to create task");
            }
            const newTask = await res.json();
            setTasks((prev) => [newTask, ...prev]);
            setTitle("");
            setDescription("");
            setFile(null);
            setFilePreview(null);
            setCompleted(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (task) => {
        try {
            const res = await authFetch(`${API_BASE_URL}/api/tasks/${task._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ completed: !task.completed }),
            });
            if (!res.ok) throw new Error("Failed to update task");
            const updated = await res.json();
            setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
        } catch (e) {
            setError(e.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this personal task?")) return;
        try {
            const res = await authFetch(`${API_BASE_URL}/api/tasks/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete task");
            setTasks((prev) => prev.filter((t) => t._id !== id));
        } catch (e) {
            setError(e.message);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <div className="p-2 bg-blue-500 rounded-lg">
                    <ClipboardList className="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 className="font-semibold text-gray-800 text-sm">My Personal Tasks</h2>
                    <p className="text-xs text-gray-500">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</p>
                </div>
            </div>

            {/* Add task form */}
            <div className="p-5 border-b border-gray-50">
                <form onSubmit={handleCreate} className="space-y-3">
                    <Field className="gap-2">
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Input
                                type="text"
                                placeholder="Task name…"
                                id="pt-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="flex-1"
                            />
                            <Input
                                type="text"
                                placeholder="Description (optional)"
                                id="pt-desc"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="flex-1"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="pt-done"
                                    checked={completed}
                                    onCheckedChange={setCompleted}
                                />
                                <label htmlFor="pt-done" className="text-sm text-gray-600">
                                    Mark as done
                                </label>
                            </div>
                            <div className="flex flex-col gap-1">
                                <Input
                                    type="file"
                                    id="pt-img"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    ref={fileInputRef}
                                    className="text-sm"
                                />
                                {filePreview && (
                                    <div className="mt-1.5 relative inline-block">
                                        <img
                                            src={filePreview}
                                            alt="Preview"
                                            className="h-12 w-12 object-cover rounded-xl ring-1 ring-gray-200 shadow"
                                        />
                                        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[9px] font-semibold px-1 rounded-full leading-4">NEW</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <Button type="submit" size="sm" disabled={saving} className="w-fit gap-1">
                            <Plus className="w-3.5 h-3.5" />
                            {saving ? "Adding…" : "Add Task"}
                        </Button>
                    </Field>
                </form>
                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            </div>

            {/* Task list */}
            <div className="divide-y divide-gray-50">
                {loading && (
                    <p className="text-center text-sm text-gray-400 py-6">Loading…</p>
                )}
                {!loading && tasks.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-8">
                        No personal tasks yet. Add one above!
                    </p>
                )}
                {tasks.map((task) => (
                    <div
                        key={task._id}
                        className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group"
                    >
                        <button
                            onClick={() => handleToggle(task)}
                            className="mt-0.5 shrink-0 text-gray-400 hover:text-blue-500 transition-colors"
                            title={task.completed ? "Mark incomplete" : "Mark complete"}
                        >
                            {task.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : (
                                <Circle className="w-5 h-5" />
                            )}
                        </button>
                        <div className="flex-1  min-w-0">
                            <p
                                className={`text-sm font-medium truncate ${task.completed ? "line-through text-gray-400" : "text-gray-800"
                                    }`}
                            >
                                {task.title}
                            </p>
                            <div className="flex flex-row gap-10 ">
                                {task.description && (
                                <p className="text-xs text-gray-500 truncate">{task.description}</p>
                            )}
                            {task.image && (
                                <button
                                    onClick={() => window.open(`${API_BASE_URL}/uploads/${task.image}`, "_blank")}
                                    className="mt-[-20px] relative inline-block group/img rounded-xl overflow-hidden ring-1 ring-gray-100 shadow hover:shadow-md transition-shadow"
                                    title="View full image"
                                >
                                    <img
                                        src={`${API_BASE_URL}/uploads/${task.image}`}
                                        alt="Task attachment"
                                        className="h-12 w-12 object-cover transition-transform duration-200 group-hover/img:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                                        <svg className="w-3.5 h-3.5 text-white opacity-0 group-hover/img:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    </div>
                                </button>
                            )}

                            </div>
                            
                        </div>
                        <button
                            onClick={() => handleDelete(task._id)}
                            className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                            title="Delete task"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Admin: Assign Task Form ─────────────────────────────── */
function AdminAssignPanel({ onTaskAssigned }) {
    const { authFetch } = useAuth();
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(true);

    const [assignedTo, setAssignedTo] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [deadline, setDeadline] = useState("");
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await authFetch(`${API_BASE_URL}/api/admin-tasks/users`);
                if (!res.ok) throw new Error("Failed to load users");
                const data = await res.json();
                setUsers(data);
                if (data.length > 0) setAssignedTo(data[0]._id);
            } catch (e) {
                setError(e.message);
            } finally {
                setUsersLoading(false);
            }
        })();
    }, [authFetch]);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        setFile(selected);
        if (selected) {
            setFilePreview(URL.createObjectURL(selected));
        } else {
            setFilePreview(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return setError("Title is required");
        if (!assignedTo) return setError("Please select a member to assign to");

        const fd = new FormData();
        fd.append("title", title);
        fd.append("description", description);
        fd.append("assignedTo", assignedTo);
        if (deadline) fd.append("deadline", deadline);
        if (file) fd.append("taskImage", file);

        setSaving(true);
        setError("");
        try {
            const res = await authFetch(`${API_BASE_URL}/api/admin-tasks`, {
                method: "POST",
                body: fd,
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Failed to assign task");
            }
            setTitle("");
            setDescription("");
            setDeadline("");
            setFile(null);
            setFilePreview(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            onTaskAssigned?.();
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
                <div className="p-2 bg-purple-600 rounded-lg">
                    <UserCheck className="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 className="font-semibold text-gray-800 text-sm">Assign a Task</h2>
                    <p className="text-xs text-gray-500">Delegate work to a team member</p>
                </div>
            </div>

            <div className="p-5">
                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Assign to */}
                    <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">
                            Assign to
                        </label>
                        {usersLoading ? (
                            <p className="text-xs text-gray-400">Loading members…</p>
                        ) : users.length === 0 ? (
                            <p className="text-xs text-amber-600">No members found.</p>
                        ) : (
                            <select
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                            >
                                {users.map((u) => (
                                    <option key={u._id} value={u._id}>
                                        {u.name} — {u.email}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                            <label className="text-xs font-medium text-gray-600 mb-1 block">
                                Task Title *
                            </label>
                            <Input
                                type="text"
                                placeholder="Task title…"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-medium text-gray-600 mb-1 block">
                                Deadline
                            </label>
                            <Input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">
                            Description
                        </label>
                        <Input
                            type="text"
                            placeholder="Optional description…"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">
                            Attachment
                        </label>
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            className="text-sm"
                        />
                        {filePreview && (
                            <div className="mt-1.5 relative inline-block">
                                <img
                                    src={filePreview}
                                    alt="Preview"
                                    className="h-12 w-12 object-cover rounded-xl ring-1 ring-gray-200 shadow"
                                />
                                <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-[9px] font-semibold px-1 rounded-full leading-4">NEW</span>
                            </div>
                        )}
                    </div>

                    {error && <p className="text-red-500 text-xs">{error}</p>}

                    <Button
                        type="submit"
                        size="sm"
                        disabled={saving || usersLoading || users.length === 0}
                        className="w-fit gap-1 bg-purple-600 hover:bg-purple-700"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        {saving ? "Assigning…" : "Assign Task"}
                    </Button>
                </form>
            </div>
        </div>
    );
}

/* ─── Admin: All Assigned Tasks (grouped by member) ─────────── */
function AdminAssignedTasksPanel({ refreshTrigger }) {
    const { authFetch } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedUsers, setExpandedUsers] = useState({});

    const loadTasks = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await authFetch(`${API_BASE_URL}/api/admin-tasks/all`);
            if (!res.ok) throw new Error("Failed to load assigned tasks");
            setTasks(await res.json());
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [authFetch]);

    useEffect(() => {
        loadTasks();
    }, [loadTasks, refreshTrigger]);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this assigned task?")) return;
        try {
            const res = await authFetch(`${API_BASE_URL}/api/admin-tasks/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete");
            setTasks((prev) => prev.filter((t) => t._id !== id));
        } catch (e) {
            alert(e.message);
        }
    };

    const toggleUser = (userId) =>
        setExpandedUsers((prev) => ({ ...prev, [userId]: !prev[userId] }));

    // Group tasks by assignedTo user
    const grouped = tasks.reduce((acc, task) => {
        const uid = task.assignedTo?._id || "unknown";
        if (!acc[uid]) acc[uid] = { user: task.assignedTo, tasks: [] };
        acc[uid].tasks.push(task);
        return acc;
    }, {});

    const groups = Object.values(grouped);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
                <div className="p-2 bg-gray-700 rounded-lg">
                    <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 className="font-semibold text-gray-800 text-sm">All Assigned Tasks</h2>
                    <p className="text-xs text-gray-500">
                        {tasks.length} task{tasks.length !== 1 ? "s" : ""} across {groups.length} member{groups.length !== 1 ? "s" : ""}
                    </p>
                </div>
            </div>

            <div className="divide-y divide-gray-50">
                {loading && (
                    <p className="text-center text-sm text-gray-400 py-6">Loading…</p>
                )}
                {error && (
                    <p className="text-center text-sm text-red-500 py-4">{error}</p>
                )}
                {!loading && groups.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-8">
                        No tasks assigned yet.
                    </p>
                )}

                {groups.map((group) => {
                    const uid = group.user?._id || "unknown";
                    const isExpanded = expandedUsers[uid] !== false; // default expanded
                    return (
                        <div key={uid}>
                            {/* Member header (collapsible) */}
                            <button
                                onClick={() => toggleUser(uid)}
                                className="w-full flex items-center gap-3 px-5 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                            >
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 text-xs font-bold shrink-0">
                                    {(group.user?.name || "?").slice(0, 1).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">
                                        {group.user?.name || "Unknown user"}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {group.user?.email}
                                    </p>
                                </div>
                                <span className="text-xs text-gray-400 shrink-0 mr-2">
                                    {group.tasks.length} task{group.tasks.length !== 1 ? "s" : ""}
                                </span>
                                {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                                )}
                            </button>

                            {/* Task rows */}
                            {isExpanded && (
                                <div className="divide-y divide-gray-50">
                                    {group.tasks.map((task) => (
                                        <div
                                            key={task._id}
                                            className="flex items-start gap-3 pl-16 pr-5 py-3 hover:bg-gray-50 transition-colors group"
                                        >
                                            <StatusIcon status={task.status} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">
                                                    {task.title}
                                                </p>
                                                {task.description && (
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {task.description}
                                                    </p>
                                                )}
                                                {task.image && (
                                                    <button
                                                        onClick={() => window.open(`${API_BASE_URL}/uploads/${task.image}`, "_blank")}
                                                        className="mt-1.5 relative inline-block group/img rounded-xl overflow-hidden ring-1 ring-gray-100 shadow hover:shadow-md transition-shadow"
                                                        title="View full image"
                                                    >
                                                        <img
                                                            src={`${API_BASE_URL}/uploads/${task.image}`}
                                                            alt="Task attachment"
                                                            className="h-12 w-12 object-cover transition-transform duration-200 group-hover/img:scale-110"
                                                        />
                                                        <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                                                            <svg className="w-3.5 h-3.5 text-white opacity-0 group-hover/img:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                        </div>
                                                    </button>
                                                )}
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span
                                                        className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusBadge(task.status)}`}
                                                    >
                                                        {task.status}
                                                    </span>
                                                    {task.deadline && (
                                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(task.deadline).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(task._id)}
                                                className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all mt-0.5"
                                                title="Delete task"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─── User: Tasks Assigned to Them ──────────────────────────── */
function UserAssignedTasksPanel() {
    const { authFetch } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadTasks = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await authFetch(`${API_BASE_URL}/api/admin-tasks/my`);
            if (!res.ok) throw new Error("Failed to load assigned tasks");
            setTasks(await res.json());
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [authFetch]);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    const handleStatusChange = async (id, newStatus) => {
        try {
            const res = await authFetch(
                `${API_BASE_URL}/api/admin-tasks/my/${id}/status`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: newStatus }),
                }
            );
            if (!res.ok) throw new Error("Failed to update status");
            const updated = await res.json();
            setTasks((prev) =>
                prev.map((t) => (t._id === id ? { ...t, status: updated.status } : t))
            );
        } catch (e) {
            alert(e.message);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
                <div className="p-2 bg-violet-600 rounded-lg">
                    <Tag className="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 className="font-semibold text-gray-800 text-sm">Assigned to You</h2>
                    <p className="text-xs text-gray-500">
                        {tasks.length} task{tasks.length !== 1 ? "s" : ""} from admin
                    </p>
                </div>
            </div>

            <div className="divide-y divide-gray-50">
                {loading && (
                    <p className="text-center text-sm text-gray-400 py-6">Loading…</p>
                )}
                {error && (
                    <p className="text-center text-sm text-red-500 py-4">{error}</p>
                )}
                {!loading && tasks.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-8">
                        No tasks assigned to you yet.
                    </p>
                )}
                {tasks.map((task) => (
                    <div
                        key={task._id}
                        className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
                    >
                        <StatusIcon status={task.status} />
                        <div className="flex-1 min-w-0">
                            <p
                                className={`text-sm font-medium truncate ${task.status === "completed"
                                    ? "line-through text-gray-400"
                                    : "text-gray-800"
                                    }`}
                            >
                                {task.title}
                            </p>
                            {task.description && (
                                <p className="text-xs text-gray-500 truncate">{task.description}</p>
                            )}
                            {task.image && (
                                <button
                                    onClick={() => window.open(`${API_BASE_URL}/uploads/${task.image}`, "_blank")}
                                    className="mt-1.5 relative inline-block group/img rounded-xl overflow-hidden ring-1 ring-gray-100 shadow hover:shadow-md transition-shadow"
                                    title="View full image"
                                >
                                    <img
                                        src={`${API_BASE_URL}/uploads/${task.image}`}
                                        alt="Task attachment"
                                        className="h-12 w-12 object-cover transition-transform duration-200 group-hover/img:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                                        <svg className="w-3.5 h-3.5 text-white opacity-0 group-hover/img:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    </div>
                                </button>
                            )}
                            <p className="text-xs text-gray-400 mt-0.5">
                                From:{" "}
                                <span className="font-medium text-gray-600">
                                    {task.assignedBy?.name}
                                </span>
                            </p>
                            {task.deadline && (
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3 h-3" />
                                    Due {new Date(task.deadline).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                        <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task._id, e.target.value)}
                            className="shrink-0 text-xs border rounded-lg px-2 py-1.5 outline-none bg-gray-50 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Main Export ────────────────────────────────────────────── */
export default function TaskAssignment() {
    const { isAdmin } = useAuth();
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    return (
        <div className="space-y-6">
            {/* Personal tasks — visible to ALL */}
            <PersonalTasksPanel />

            {isAdmin ? (
                /* Admin: assign form + grouped list */
                <div className="space-y-6">
                    <AdminAssignPanel onTaskAssigned={() => setRefreshTrigger((n) => n + 1)} />
                    <AdminAssignedTasksPanel refreshTrigger={refreshTrigger} />
                </div>
            ) : (
                /* Regular user: tasks assigned to them */
                <UserAssignedTasksPanel />
            )}
        </div>
    );
}
