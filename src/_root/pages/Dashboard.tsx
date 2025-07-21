import Header from '../../lib/components/shared/Header';
import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import ServicesTable from '../../lib/tables/ServicesTable';
import AnalyticsTable from '../../lib/tables/AnalyticsTable';
import HistoryTable from '../../lib/tables/HistoryTable';

const Dashboard = () => {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";
  
  const [activeTab, setActiveTab] = useState<"services" | "analytics" | "history" | "admin-all" | "admin-pending">("services");

  return (
    <div className="min-h-screen min-w-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-6 flex gap-4 flex-wrap">
          <button 
            className={`px-4 py-2 rounded ${activeTab === "services" ? "bg-blue-600 text-white" : "bg-white border"}`}
            onClick={() => setActiveTab("services")}
          >
            Serviços
          </button>
          <button 
            className={`px-4 py-2 rounded ${activeTab === "analytics" ? "bg-blue-600 text-white" : "bg-white border"}`}
            onClick={() => setActiveTab("analytics")}
          >
            Analíticos
          </button>
          <button 
            className={`px-4 py-2 rounded ${activeTab === "history" ? "bg-blue-600 text-white" : "bg-white border"}`}
            onClick={() => setActiveTab("history")}
          >
            Histórico
          </button>
          
          {isAdmin && (
            <>
              <button 
                className={`px-4 py-2 rounded ${activeTab === "admin-all" ? "bg-red-600 text-white" : "bg-white border border-red-300 text-red-600"}`}
                onClick={() => setActiveTab("admin-all")}
              >
                Admin: Todos os Serviços
              </button>
              <button 
                className={`px-4 py-2 rounded ${activeTab === "admin-pending" ? "bg-orange-600 text-white" : "bg-white border border-orange-300 text-orange-600"}`}
                onClick={() => setActiveTab("admin-pending")}
              >
                Admin: Pendentes de Autorização
              </button>
            </>
          )}
        </div>

        {activeTab === "services" && <ServicesTable />}
        {activeTab === "analytics" && <AnalyticsTable />}
        {activeTab === "history" && <HistoryTable />}
        {activeTab === "admin-all" && <HistoryTable viewMode="admin-all" />}
        {activeTab === "admin-pending" && <HistoryTable viewMode="admin-pending" />}

      </main>
    </div>
  )
}

export default Dashboard