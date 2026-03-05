import { useCallback, useEffect, useState , useRef} from "react";
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
    <label htmlFor="task-image">Task Image</label>
    <Input 
      type="file" 
      id="task-image" 
      onChange={(e) => setFile(e.target.files[0])}
      ref={fileInputRef}
     // Don't forget to add a 'file' state!
    />
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
