import { useCallback, useEffect, useState, useRef } from "react";
import { Field } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/AuthContext";


const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function TaskForm() {
  const fileInputRef = useRef(null);
  const { authFetch } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [completed, setCompleted] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authFetch(`${API_BASE_URL}/api/tasks`);
      if (!response.ok) {
        throw new Error("Unable to load tasks");
      }
      const data = await response.json();
      setTasks(data);
    } catch (loadError) {
      setError(loadError.message || "Unable to load tasks");
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreateTask = async (event) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("Task name is required");
      return;
    }

    // 1. Create a FormData object
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("completed", completed);
    if (file) formData.append("taskImage", file);

    setSaving(true);
    setError("");
    try {
      const response = await authFetch(`${API_BASE_URL}/api/tasks`, {
        method: "POST",
        // headers: { "Content-Type": "application/json" },
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Unable to create task");
      }

      const newTask = await response.json();
      setTasks((prev) => [newTask, ...prev]);
      setTitle("");
      setDescription("");
      setFile(null);
      setFilePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setCompleted(false);
    } catch (createError) {
      setError(createError.message || "Unable to create task");
      console.log(createError)
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTask = async (task) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/tasks/${task._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });

      if (!response.ok) {
        throw new Error("Unable to update task");
      }

      const updatedTask = await response.json();
      setTasks((prev) => prev.map((item) => (item._id === updatedTask._id ? updatedTask : item)));
    } catch (updateError) {
      setError(updateError.message || "Unable to update task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to delete task");
      }

      setTasks((prev) => prev.filter((item) => item._id !== taskId));
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete task");
    }
  };

  return (
    <div className="w-full h-max-content border p-4 rounded-lg shadow-md">
      <form onSubmit={handleCreateTask} e>
        <Field className="w-full gap-2">
          <div className="flex flex-col sm:flex-row sm:items-end sm:gap-2">
            <div className="flex flex-col w-full">
              <label htmlFor="task-name">Task Name</label>
              <Input
                type="text"
                placeholder="Task Name"
                id="task-name"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>

            <div className="flex flex-col w-full">
              <label htmlFor="task-description">Task Description</label>
              <Input
                type="text"
                placeholder="Task description"
                id="task-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <Switch id="task-status" checked={completed} onCheckedChange={setCompleted} />
              <label htmlFor="task-status">Done</label>
            </div>

          </div>
          <div className="flex flex-col w-full">
            <label htmlFor="task-image">Task Attachment</label>
            <Input
              type="file"
              id="task-image"
              accept="image/*,application/pdf"
              onChange={(e) => {
                const selected = e.target.files[0];
                setFile(selected);
                setFilePreview(selected ? URL.createObjectURL(selected) : null);
              }}
              ref={fileInputRef}
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
          <Button type="submit" className="mt-3" disabled={saving}>
            {saving ? "Saving..." : "Add Task"}
          </Button>


        </Field>
      </form>

      {error ? <p className="text-red-600 text-sm mt-3">{error}</p> : null}

      <div className="mt-5 space-y-2">
        {loading ? <p className="text-sm text-gray-500">Loading tasks...</p> : null}
        {!loading && tasks.length === 0 ? <p className="text-sm text-gray-500">No tasks yet.</p> : null}
        {tasks.map((task) => (
          <div key={task._id} className="border rounded-md p-3 flex justify-between items-start gap-3">
            <div className="flex-1">
              <p className={`font-medium ${task.completed ? "line-through text-gray-500" : ""}`}>
                {task.title}
              </p>
              {task.description ? <p className="text-sm text-gray-600">{task.description}</p> : null}
              {task.image && (
                task.image.toLowerCase().endsWith(".pdf") ? (
                  <button
                    onClick={() => window.open(`${API_BASE_URL}/uploads/${task.image}`, "_blank")}
                    className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-2 py-1.5 transition-colors"
                    title="Open PDF"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 17.5h-1v-5h1.8c1.1 0 1.7.6 1.7 1.5s-.6 1.5-1.7 1.5H8.5v2zm0-2.8h.8c.5 0 .8-.3.8-.7s-.3-.7-.8-.7H8.5v1.4zm4.8 2.8h-1.6v-5h1.6c1.4 0 2.2.9 2.2 2.5s-.8 2.5-2.2 2.5zm-.7-.8h.7c.8 0 1.3-.6 1.3-1.7s-.5-1.7-1.3-1.7h-.7v3.4zm5-4.2v.8h-1.8v1.2h1.6v.8h-1.6v2h-1v-4.8h2.8z" /></svg>
                    Open PDF
                  </button>
                ) : (
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
                )
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleToggleTask(task)}
              >
                {task.completed ? "Undo" : "Done"}
              </Button>
              <Button type="button" variant="outline" onClick={() => handleDeleteTask(task._id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
