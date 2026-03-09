import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/auth/AuthContext";
import {
    CheckCircle2,
    Circle,
    Clock,
    ChevronDown,
    ChevronRight,
    Tag,
    ClipboardList,
    Users,
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

function FilterBar({ filters, active, onChange }) {
    return (
        <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
                <button
                    key={f.value}
                    onClick={() => onChange(f.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${active === f.value
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                        }`}
                >
                    {f.label}
                </button>
            ))}
        </div>
    );
}

FilterBar.displayName = "FilterBar";

/* ─── Personal Tasks List (read-only) ─────────────────────── */
function PersonalTasksReadOnly() {
    const { authFetch } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${API_BASE_URL}/api/tasks`);
            if (!res.ok) throw new Error();
            setTasks(await res.json());
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, [authFetch]);

    useEffect(() => { load(); }, [load]);

    const FILTERS = [
        { value: "all", label: "All" },
        { value: "pending", label: "Pending" },
        { value: "done", label: "Done" },
    ];

    const visible = tasks.filter((t) => {
        if (filter === "done") return t.completed;
        if (filter === "pending") return !t.completed;
        return true;
    });

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                        <ClipboardList className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-800 text-sm">My Personal Tasks</h2>
                        <p className="text-xs text-gray-500">
                            {visible.length} of {tasks.length} task{tasks.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
                <FilterBar filters={FILTERS} active={filter} onChange={setFilter} />
            </div>

            {/* List */}
            <div className="divide-y divide-gray-50">
                {loading && (
                    <p className="text-center text-sm text-gray-400 py-6">Loading…</p>
                )}
                {!loading && visible.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-8">
                        No tasks match this filter.
                    </p>
                )}
                {visible.map((task) => (
                    <div
                        key={task._id}
                        className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                    >
                        <div className="mt-0.5 shrink-0">
                            {task.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : (
                                <Circle className="w-5 h-5 text-gray-300" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p
                                className={`text-sm font-medium truncate ${task.completed ? "line-through text-gray-400" : "text-gray-800"
                                    }`}
                            >
                                {task.title}
                            </p>
                            {task.description && (
                                <p className="text-xs text-gray-500 truncate">{task.description}</p>
                            )}
                        </div>
                        <span
                            className={`shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${task.completed
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : "bg-amber-100 text-amber-800 border-amber-300"
                                }`}
                        >
                            {task.completed ? "Done" : "Pending"}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

PersonalTasksReadOnly.displayName = "PersonalTasksReadOnly";

function AdminAssignedReadOnly() {
    const { authFetch } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [expandedUsers, setExpandedUsers] = useState({});

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${API_BASE_URL}/api/admin-tasks/all`);
            if (!res.ok) throw new Error();
            setTasks(await res.json());
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, [authFetch]);

    useEffect(() => { load(); }, [load]);

    const FILTERS = [
        { value: "all", label: "All" },
        { value: "pending", label: "Pending" },
        { value: "in-progress", label: "In Progress" },
        { value: "completed", label: "Completed" },
    ];

    const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

    // Group by member
    const grouped = filtered.reduce((acc, task) => {
        const uid = task.assignedTo?._id || "unknown";
        if (!acc[uid]) acc[uid] = { user: task.assignedTo, tasks: [] };
        acc[uid].tasks.push(task);
        return acc;
    }, {});
    const groups = Object.values(grouped);

    const toggleUser = (uid) =>
        setExpandedUsers((prev) => ({ ...prev, [uid]: !prev[uid] }));

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-700 rounded-lg">
                        <Users className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-800 text-sm">All Assigned Tasks</h2>
                        <p className="text-xs text-gray-500">
                            {filtered.length} task{filtered.length !== 1 ? "s" : ""} across {groups.length} member{groups.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
                <FilterBar filters={FILTERS} active={filter} onChange={setFilter} />
            </div>

            <div className="divide-y divide-gray-50">
                {loading && (
                    <p className="text-center text-sm text-gray-400 py-6">Loading…</p>
                )}
                {!loading && groups.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-8">
                        No tasks match this filter.
                    </p>
                )}
                {groups.map((group) => {
                    const uid = group.user?._id || "unknown";
                    const isExpanded = expandedUsers[uid] !== false;
                    return (
                        <div key={uid}>
                            <button
                                onClick={() => toggleUser(uid)}
                                className="w-full flex items-center gap-3 px-5 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                            >
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 text-xs font-bold shrink-0">
                                    {(group.user?.name || "?").slice(0, 1).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">
                                        {group.user?.name || "Unknown"}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{group.user?.email}</p>
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
                            {isExpanded &&
                                group.tasks.map((task) => (
                                    <div
                                        key={task._id}
                                        className="flex items-start gap-3 pl-16 pr-5 py-3 hover:bg-gray-50 transition-colors"
                                    >
                                        <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">
                                                {task.title}
                                            </p>
                                            {task.description && (
                                                <p className="text-xs text-gray-500 truncate">{task.description}</p>
                                            )}
                                            {task.deadline && (
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    Due {new Date(task.deadline).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                        <span
                                            className={`shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${statusBadge(task.status)}`}
                                        >
                                            {task.status}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

AdminAssignedReadOnly.displayName = "AdminAssignedReadOnly";

function UserAssignedReadOnly() {
    const { authFetch } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${API_BASE_URL}/api/admin-tasks/my`);
            if (!res.ok) throw new Error();
            setTasks(await res.json());
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, [authFetch]);

    useEffect(() => { load(); }, [load]);

    const FILTERS = [
        { value: "all", label: "All" },
        { value: "pending", label: "Pending" },
        { value: "in-progress", label: "In Progress" },
        { value: "completed", label: "Completed" },
    ];

    const visible = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-600 rounded-lg">
                        <Tag className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-800 text-sm">Assigned to You</h2>
                        <p className="text-xs text-gray-500">
                            {visible.length} of {tasks.length} task{tasks.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
                <FilterBar filters={FILTERS} active={filter} onChange={setFilter} />
            </div>

            <div className="divide-y divide-gray-50">
                {loading && (
                    <p className="text-center text-sm text-gray-400 py-6">Loading…</p>
                )}
                {!loading && visible.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-8">
                        No tasks match this filter.
                    </p>
                )}
                {visible.map((task) => (
                    <div
                        key={task._id}
                        className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
                    >
                        <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
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
                        <span
                            className={`shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${statusBadge(task.status)}`}
                        >
                            {task.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

UserAssignedReadOnly.displayName = "UserAssignedReadOnly";

/* ─── Main Export ─────────────────────────────────────────── */
export default function TaskListView() {
    const { isAdmin } = useAuth();

    return (
        <div className="space-y-6">
            <PersonalTasksReadOnly />
            {isAdmin ? <AdminAssignedReadOnly /> : <UserAssignedReadOnly />}
        </div>
    );
}

TaskListView.displayName = "TaskListView";
