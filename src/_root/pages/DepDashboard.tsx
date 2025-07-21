import { SignedIn, UserButton } from "@clerk/clerk-react";
import { useUser } from "@clerk/clerk-react";
import { useState } from "react"; // Import useState
import { createClient } from "@supabase/supabase-js"; // Import Supabase client

// Initialize Supabase client outside the component to avoid re-initialization on re-renders
const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL and Anon Key must be provided in the .env file"
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const Dashboard = () => {
  const { user, isLoaded } = useUser();
  const [showModal, setShowModal] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const openModal = () => {
    setShowModal(true);
    setError(null); // Clear previous errors
    setSuccess(null); // Clear previous success messages
  };

  const closeModal = () => {
    setShowModal(false);
    setTaskName(""); // Clear task name on close
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) {
      setError("Task name cannot be empty.");
      return;
    }

    if (!user?.id) {
      setError("User not authenticated.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Supabase automatically handles 'id' field as auto-increment if not provided
      const { data, error: supabaseError } = await supabase
        .from("tasks")
        .insert([{ name: taskName, user_id: user.id }])
        .select();

      if (supabaseError) {
        setError(supabaseError.message);
      } else {
        setSuccess("Task added successfully!");
        console.log("New task added:", data);
        closeModal(); // Close modal on successful insertion
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <SignedIn>
          <div className="header-content">
            <h2>
              Olá,{" "}
              {isLoaded ? user?.username || user?.fullName || "User" : "Loading..."}
            </h2>
            <UserButton />
          </div>
        </SignedIn>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <SignedIn>
          <div className="dashboard-content">
            <div className="dashboard-actions">
              <button
                onClick={() => (window.location.href = "/user")}
                className="action-button"
              >
                Go to User Page
              </button>
            </div>

            {/* Dashboard Cards/Widgets */}
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <h3>Recent Activity</h3>
                <p>Your recent activities will appear here.</p>
              </div>

              <div className="dashboard-card">
                <h3>Quick Stats</h3>
                <p>Key metrics and statistics.</p>
              </div>

              <div className="dashboard-card">
                <h3>Quick Actions</h3>
                <div className="quick-actions">
                  <button onClick={openModal} className="quick-action-btn">
                    New Project
                  </button>
                  <button className="quick-action-btn">View Reports</button>
                  <button className="quick-action-btn">Settings</button>
                </div>
              </div>
            </div>
          </div>
        </SignedIn>
      </main>

      {/* New Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Add New Task</h3>
            <form onSubmit={handleAddTask}>
              <div className="mb-4">
                <label
                  htmlFor="taskName"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Task Name:
                </label>
                <input
                  type="text"
                  id="taskName"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  disabled={loading}
                />
              </div>
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
              {success && <p className="text-green-500 text-sm mb-4">{success}</p>}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="action-button"
                  disabled={loading}
                >
                  {loading ? "Adding..." : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;