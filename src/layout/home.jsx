import { SearchIcon, LayoutDashboard, ClipboardList, Settings, Info } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import TaskForm from "@/components/TaskForm";
import AdminTaskForm from "@/components/AdminTaskForm";
import AdminTaskList from "@/components/AdminTaskList";
import UserTaskList from "@/components/UserTaskList";
import { useState } from "react";
import { Button } from "@/components/ui/button";


export default function Home({ user, onLogout }) {
  const { isAdmin } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTaskCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="w-full bg-gray-800 text-white p-4 shadow-md flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-8 h-8 text-blue-400" />
          <h1 className="text-2xl font-bold tracking-tight">DOT IT <span className="text-blue-400">TMS</span></h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-2">
            <span className="text-sm font-medium">{user?.name}</span>
            <span className="text-xs text-gray-400 uppercase tracking-wider">{user?.role}</span>
          </div>
          <div
            className="flex items-center justify-center border-2 border-blue-500 rounded-full w-10 h-10 bg-gray-700 text-blue-400 font-bold"
            title={user?.name || "User"}
          >
            {(user?.name || "U").slice(0, 1).toUpperCase()}
          </div>
          <Button variant="outline" className="text-white border-gray-600 hover:bg-gray-700" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Nav */}
        <nav className="w-64 bg-gray-900 text-gray-300 p-4 hidden md:flex flex-col gap-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4 px-2">Menu</div>
          <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active />
          <NavItem icon={<ClipboardList size={18} />} label={isAdmin ? "Task Assignment" : "My Assigned Tasks"} />
          <NavItem icon={<Settings size={18} />} label="Settings" />
          <NavItem icon={<Info size={18} />} label="About" />
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-8">

            {/* Search/Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border">
              <div className="relative w-full max-w-md">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Welcome back, <strong>{user?.name.split(' ')[0]}</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Personal Tasks Section - For Everyone */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-800">Personal Space</h2>
                </div>
                <TaskForm />
              </section>

              {/* Admin/Assigned Tasks Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {isAdmin ? "Admin Controls" : "Tasks Assigned to You"}
                  </h2>
                </div>

                {isAdmin ? (
                  <div className="space-y-6">
                    <AdminTaskForm onTaskCreated={handleTaskCreated} />
                    <div className="bg-white rounded-xl shadow-sm border p-5">
                      <h3 className="font-semibold text-gray-700 mb-4 border-b pb-2">Previously Assigned Tasks</h3>
                      <AdminTaskList refreshTrigger={refreshTrigger} />
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border p-5">
                    <UserTaskList />
                  </div>
                )}
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${active ? "bg-blue-600 text-white font-medium" : "hover:bg-gray-800 hover:text-white"
      }`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}
