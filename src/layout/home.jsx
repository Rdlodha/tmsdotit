import { useState } from "react";
import { SearchIcon, LayoutDashboard, ClipboardList, Settings, Info } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import TaskAssignment from "@/components/TaskAssignment";
import TaskListView from "@/components/TaskListView";
import { Button } from "@/components/ui/button";

export default function Home({ user, onLogout }) {
  const { isAdmin } = useAuth();
  const [activeView, setActiveView] = useState("dashboard");

  const navItems = [
    {
      id: "dashboard",
      icon: <LayoutDashboard size={18} />,
      label: "Dashboard",
    },
    {
      id: "tasks",
      icon: <ClipboardList size={18} />,
      label: isAdmin ? "Tasks" : "My Tasks",
    },
    {
      id: "settings",
      icon: <Settings size={18} />,
      label: "Settings",
    },
    {
      id: "about",
      icon: <Info size={18} />,
      label: "About",
    },
  ];

  const viewTitle =
    activeView === "tasks"
      ? isAdmin
        ? "Task Assignment"
        : "My Tasks"
      : activeView === "settings"
        ? "Settings"
        : activeView === "about"
          ? "About"
          : "Dashboard";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="w-full bg-gray-800 text-white p-4 shadow-md flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-8 h-8 text-blue-400" />
          <h1 className="text-2xl font-bold tracking-tight">
            DOT IT <span className="text-blue-400">TMS</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-2">
            <span className="text-sm font-medium">{user?.name}</span>
            <span className="text-xs text-gray-400 uppercase tracking-wider">
              {user?.role}
            </span>
          </div>
          <div
            className="flex items-center justify-center border-2 border-blue-500 rounded-full w-10 h-10 bg-gray-700 text-blue-400 font-bold"
            title={user?.name || "User"}
          >
            {(user?.name || "U").slice(0, 1).toUpperCase()}
          </div>
          <Button
            variant="outline"
            className="text-black border-gray-600 hover:bg-gray-600 hover:text-white"
            onClick={onLogout}
          >
            Logout
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar (desktop only) ─────────────────────────────── */}
        <nav className="w-64 bg-gray-900 text-gray-300 p-4 hidden md:flex flex-col gap-2 shrink-0">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4 px-2">
            Menu
          </div>
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeView === item.id}
              onClick={() => setActiveView(item.id)}
            />
          ))}
        </nav>

        {/* ── Main Content ───────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          <div className="max-w-3xl mx-auto space-y-6">

            {/* Top bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-gray-800">{viewTitle}</h2>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
                <span className="text-sm text-gray-500 shrink-0 hidden sm:block">
                  Hi, <strong>{user?.name?.split(" ")[0]}</strong>
                </span>
              </div>
            </div>

            {/* View content */}
            {activeView === "dashboard" && <TaskAssignment />}
            {activeView === "tasks" && <TaskListView />}
            {(activeView === "settings" || activeView === "about") && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center text-gray-400 text-sm">
                {activeView === "settings" ? "Settings coming soon." : "About coming soon."}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* ── Bottom Nav Bar (mobile only) ───────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 flex md:hidden">
        {navItems.map((item) => (
          <MobileNavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeView === item.id}
            onClick={() => setActiveView(item.id)}
          />
        ))}
      </nav>
    </div>
  );
}

/* ── Sidebar NavItem (desktop) ─────────────────────────────── */
function NavItem({ icon, label, active = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${active
        ? "bg-blue-600 text-white font-medium"
        : "hover:bg-gray-800 hover:text-white"
        }`}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

/* ── Bottom NavItem (mobile) ───────────────────────────────── */
function MobileNavItem({ icon, label, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${active
        ? "text-blue-400"
        : "text-gray-400 hover:text-gray-200"
        }`}
    >
      <span className={`transition-transform ${active ? "scale-110" : ""}`}>
        {icon}
      </span>
      <span className="truncate max-w-[4rem] text-center">{label}</span>
      {active && (
        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-400 rounded-full" />
      )}
    </button>
  );
}

