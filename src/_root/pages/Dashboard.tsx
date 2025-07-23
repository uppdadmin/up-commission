import Header from '../../lib/components/shared/Header';
import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import ServicesTable from '../../lib/tables/ServicesTable';
import AnalyticsTable from '../../lib/tables/AnalyticsTable';
import HistoryTable from '../../lib/tables/HistoryTable';

type TabType = "services" | "analytics" | "history" | "admin-all" | "admin-pending";

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  variant?: 'primary' | 'secondary' | 'admin' | 'warning';
}

const Dashboard = () => {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";
  const [activeTab, setActiveTab] = useState<TabType>("services");

  // Icons for tabs
  const ServiceIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 7 8.7 2.7a2.41 2.41 0 0 0-3.4 0L2.7 5.3a2.41 2.41 0 0 0 0 3.4L7 13" />
      <path d="m8 6 2-2" />
      <path d="m18 16 2-2" />
      <path d="m17 11 4.3 4.3c.94.94.94 2.46 0 3.4l-2.6 2.6c-.94.94-2.46.94-3.4 0L11 17" />
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
      <path d="m15 5 4 4" />
    </svg>
  );

  const AnalyticsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="M7 11.207a.5.5 0 0 1 .146-.353l2-2a.5.5 0 0 1 .708 0l3.292 3.292a.5.5 0 0 0 .708 0l4.292-4.292a.5.5 0 0 1 .854.353V16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z" />
    </svg>
  );

  const HistoryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M16 22h2a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3" />
      <path d="M8 14v2.2l1.6 1" />
      <circle cx="8" cy="16" r="6" />
    </svg>
  );

  const AdminIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );

  const PendingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12,6 12,12 16,14"/>
    </svg>
  );

  // Tab configuration
  const tabs: TabConfig[] = [
    {
      id: "services",
      label: "Serviços",
      icon: <ServiceIcon />,
      variant: 'primary'
    },
    {
      id: "analytics",
      label: "Analíticos",
      icon: <AnalyticsIcon />,
      variant: 'secondary'
    },
    {
      id: "history",
      label: "Histórico",
      icon: <HistoryIcon />,
      variant: 'secondary'
    },
    {
      id: "admin-all",
      label: "Admin: Todos os Serviços",
      icon: <AdminIcon />,
      adminOnly: true,
      variant: 'admin'
    },
    {
      id: "admin-pending",
      label: "Admin: Pendentes",
      icon: <PendingIcon />,
      adminOnly: true,
      variant: 'warning'
    }
  ];

  // Filter tabs based on admin status
  const visibleTabs = tabs.filter(tab => !tab.adminOnly || isAdmin);

  // Button variant styles
  const getButtonStyles = (tab: TabConfig, isActive: boolean) => {
    const baseStyles = "group flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2";
    
    if (isActive) {
      switch (tab.variant) {
        case 'primary':
          return `${baseStyles} bg-violet-600 text-violet-700 dark:text-white shadow-lg border-b-4 border-violet-800 hover:bg-violet-700 focus-visible:outline-violet-500`;
        case 'secondary':
          return `${baseStyles} bg-blue-600 text-blue-700 dark:text-white shadow-lg border-b-4 border-blue-800 hover:bg-blue-700 focus-visible:outline-blue-500`;
        case 'admin':
          return `${baseStyles} bg-red-600 text-red-700 dark:text-white shadow-lg border-b-4 border-red-800 hover:bg-red-700 focus-visible:outline-red-500`;
        case 'warning':
          return `${baseStyles} bg-orange-600 text-orange-700 dark:text-white shadow-lg border-b-4 border-orange-800 hover:bg-orange-700 focus-visible:outline-orange-500`;
        default:
          return `${baseStyles} bg-gray-600 text-gray-700 dark:text-white shadow-lg border-b-4 border-gray-800 hover:bg-gray-700 focus-visible:outline-gray-500`;
      }
    } else {
      switch (tab.variant) {
        case 'primary':
          return `${baseStyles} bg-white text-violet-700 border border-violet-300 hover:bg-violet-50 hover:border-violet-400 focus-visible:outline-violet-500`;
        case 'secondary':
          return `${baseStyles} bg-white text-blue-700 border border-blue-300 hover:bg-blue-50 hover:border-blue-400 focus-visible:outline-blue-500`;
        case 'admin':
          return `${baseStyles} bg-white text-red-700 border border-red-300 hover:bg-red-50 hover:border-red-400 focus-visible:outline-red-500`;
        case 'warning':
          return `${baseStyles} bg-white text-orange-700 border border-orange-300 hover:bg-orange-50 hover:border-orange-400 focus-visible:outline-orange-500`;
        default:
          return `${baseStyles} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus-visible:outline-gray-500`;
      }
    }
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "services":
        return <ServicesTable />;
      case "analytics":
        return <AnalyticsTable />;
      case "history":
        return <HistoryTable />;
      case "admin-all":
        return <HistoryTable viewMode="admin-all" />;
      case "admin-pending":
        return <HistoryTable viewMode="admin-pending" />;
      default:
        return <ServicesTable />;
    }
  };

  return (
    <div className="min-h-screen min-w-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                className={getButtonStyles(tab, activeTab === tab.id)}
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={activeTab === tab.id}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className=" rounded-lg overflow-hidden">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;