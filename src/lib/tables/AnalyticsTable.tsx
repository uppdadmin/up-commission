import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "../services/supabase";

type Service = {
  id: string;
  title: string;
  service_type?: string;
  user_id: string;
  username: string;
  created_at?: string;
  price?: number;
  admin_override?: boolean;
  include_in_total?: boolean;
};

type MonthlyStats = {
  month: string;
  serviceCount: number;
  totalAmount: number;
  pendingAmount: number;
  authorizedAmount: number;
  avgServiceValue: number;
};

type ServiceTypeStats = {
  type: string;
  count: number;
  totalAmount: number;
  percentage: number;
};

type PeriodType = "3months" | "6months" | "12months" | "all";

type UserStats = {
  username: string;
  serviceCount: number;
  totalAmount: number;
  authorizedAmount: number;
  pendingAmount: number;
};

const AnalyticsTable = () => {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("6months");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Button styling function
  const getButtonStyles = (variant: "pdf") => {
    const baseStyles =
      "group flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 shadow-md border-b-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-0";

    switch (variant) {
      case "pdf":
        return `${baseStyles} bg-red-600 text-white border-red-800 hover:bg-red-700 active:bg-red-800 focus-visible:outline-red-500 disabled:bg-red-600 disabled:text-white`;
      default:
        return baseStyles;
    }
  };

  useEffect(() => {
    const fetchServices = async () => {
      if (!user) return;

      setLoading(true);
      try {
        let query = supabase
          .from("services")
          .select("*")
          .order("created_at", { ascending: false });

        // If not admin, filter by user_id
        if (!isAdmin) {
          query = query.eq("user_id", user.id);
        }

        const { data, error } = await query;

        if (error) throw error;
        setServices(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [user, isAdmin]);

  const filteredServices = useMemo(() => {
    if (selectedPeriod === "all") return services;

    const now = new Date();
    const monthsToSubtract = {
      "3months": 3,
      "6months": 6,
      "12months": 12,
    }[selectedPeriod];

    const cutoffDate = new Date(
      now.getFullYear(),
      now.getMonth() - monthsToSubtract,
      1
    );

    return services.filter((service) => {
      const serviceDate = new Date(service.created_at || "");
      return serviceDate >= cutoffDate;
    });
  }, [services, selectedPeriod]);

  const overallStats = useMemo(() => {
    const totalServices = filteredServices.length;
    const authorizedServices = filteredServices.filter(
      (s) => s.include_in_total !== false
    );
    const pendingServices = filteredServices.filter(
      (s) => s.include_in_total === false
    );

    const totalAmount = filteredServices.reduce(
      (sum, service) => sum + (service.price || 0),
      0
    );
    const authorizedAmount = authorizedServices.reduce(
      (sum, service) => sum + (service.price || 0),
      0
    );
    const pendingAmount = pendingServices.reduce(
      (sum, service) => sum + (service.price || 0),
      0
    );

    const avgServiceValue = totalServices > 0 ? totalAmount / totalServices : 0;

    return {
      totalServices,
      authorizedServices: authorizedServices.length,
      pendingServices: pendingServices.length,
      totalAmount,
      authorizedAmount,
      pendingAmount,
      avgServiceValue,
    };
  }, [filteredServices]);

  const monthlyStats = useMemo((): MonthlyStats[] => {
    const grouped = filteredServices.reduce((acc, service) => {
      const date = new Date(service.created_at || "");
      const monthYear = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!acc[monthYear]) {
        acc[monthYear] = {
          month: monthYear,
          serviceCount: 0,
          totalAmount: 0,
          pendingAmount: 0,
          authorizedAmount: 0,
          avgServiceValue: 0,
        };
      }

      acc[monthYear].serviceCount++;
      acc[monthYear].totalAmount += service.price || 0;

      if (service.include_in_total === false) {
        acc[monthYear].pendingAmount += service.price || 0;
      } else {
        acc[monthYear].authorizedAmount += service.price || 0;
      }

      return acc;
    }, {} as Record<string, MonthlyStats>);

    // Calculate average service value for each month
    Object.values(grouped).forEach((stats) => {
      stats.avgServiceValue =
        stats.serviceCount > 0 ? stats.totalAmount / stats.serviceCount : 0;
    });

    return Object.values(grouped).sort((a, b) =>
      b.month.localeCompare(a.month)
    );
  }, [filteredServices]);

  const serviceTypeStats = useMemo((): ServiceTypeStats[] => {
    const grouped = filteredServices.reduce((acc, service) => {
      const type = service.service_type || "Sem Tipo";

      if (!acc[type]) {
        acc[type] = {
          type,
          count: 0,
          totalAmount: 0,
          percentage: 0,
        };
      }

      acc[type].count++;
      acc[type].totalAmount += service.price || 0;

      return acc;
    }, {} as Record<string, ServiceTypeStats>);

    const totalServices = filteredServices.length;

    return Object.values(grouped)
      .map((stat) => ({
        ...stat,
        percentage: totalServices > 0 ? (stat.count / totalServices) * 100 : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredServices]);

  // User statistics for admin view
  const userStats = useMemo(() => {
    if (!isAdmin) return [];

    const grouped = filteredServices.reduce((acc, service) => {
      const username = service.username || "Usuário Desconhecido";

      if (!acc[username]) {
        acc[username] = {
          username,
          serviceCount: 0,
          totalAmount: 0,
          authorizedAmount: 0,
          pendingAmount: 0,
        };
      }

      acc[username].serviceCount++;
      acc[username].totalAmount += service.price || 0;

      if (service.include_in_total === false) {
        acc[username].pendingAmount += service.price || 0;
      } else {
        acc[username].authorizedAmount += service.price || 0;
      }

      return acc;
    }, {} as Record<string, UserStats>);

    return Object.values(grouped).sort(
      (a: UserStats, b: UserStats) => b.totalAmount - a.totalAmount
    );
  }, [filteredServices, isAdmin]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatMonth = (monthYear: string) => {
    const [year, month] = monthYear.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  };

  const generatePDFReport = async () => {
    setIsGeneratingPDF(true);

    try {
      // Create a simple HTML report that can be printed or saved as PDF
      const reportContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Relatório de Analíticas - ${
            isAdmin ? "Admin - Todos os Serviços" : user?.firstName || "Usuário"
          }</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
            .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
            .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
            .stat-value { font-size: 24px; font-weight: bold; color: #007bff; }
            .stat-label { font-size: 14px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .currency { color: #28a745; font-weight: bold; }
            .pending { color: #ffc107; }
            .section-title { font-size: 18px; font-weight: bold; margin: 20px 0 10px 0; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Relatório de Analíticas ${
              isAdmin ? "(Admin - Todos os Serviços)" : ""
            }</h1>
            <p>Usuário: ${user?.firstName || "N/A"} ${user?.lastName || ""}</p>
            <p>Período: ${
              selectedPeriod === "all"
                ? "Todos os registros"
                : `Últimos ${selectedPeriod.replace("months", " meses")}`
            }</p>
            <p>Gerado em: ${new Date().toLocaleDateString(
              "pt-BR"
            )} às ${new Date().toLocaleTimeString("pt-BR")}</p>
          </div>

          <div class="section-title">Resumo Geral</div>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${overallStats.totalServices}</div>
              <div class="stat-label">Total de Serviços</div>
            </div>
            <div class="stat-card">
              <div class="stat-value currency">${formatCurrency(
                overallStats.totalAmount
              )}</div>
              <div class="stat-label">Valor Total</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${overallStats.authorizedServices}</div>
              <div class="stat-label">Serviços Autorizados</div>
            </div>
            <div class="stat-card">
              <div class="stat-value currency">${formatCurrency(
                overallStats.avgServiceValue
              )}</div>
              <div class="stat-label">Valor Médio por Serviço</div>
            </div>
          </div>

          ${
            isAdmin
              ? `
            <div class="section-title">Estatísticas por Usuário</div>
            <table>
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Qtd. Serviços</th>
                  <th>Valor Total</th>
                  <th>Autorizado</th>
                  <th>Pendente</th>
                </tr>
              </thead>
              <tbody>
                ${userStats
                  .map(
                    (user: UserStats) => `
                  <tr>
                    <td>${user.username}</td>
                    <td>${user.serviceCount}</td>
                    <td class="currency">${formatCurrency(
                      user.totalAmount
                    )}</td>
                    <td class="currency">${formatCurrency(
                      user.authorizedAmount
                    )}</td>
                    <td class="pending">${formatCurrency(
                      user.pendingAmount
                    )}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          `
              : ""
          }

          <div class="section-title">Estatísticas Mensais</div>
          <table>
            <thead>
              <tr>
                <th>Mês</th>
                <th>Qtd. Serviços</th>
                <th>Valor Total</th>
                <th>Autorizado</th>
                <th>Pendente</th>
                <th>Valor Médio</th>
              </tr>
            </thead>
            <tbody>
              ${monthlyStats
                .map(
                  (month) => `
                <tr>
                  <td>${formatMonth(month.month)}</td>
                  <td>${month.serviceCount}</td>
                  <td class="currency">${formatCurrency(month.totalAmount)}</td>
                  <td class="currency">${formatCurrency(
                    month.authorizedAmount
                  )}</td>
                  <td class="pending">${formatCurrency(
                    month.pendingAmount
                  )}</td>
                  <td class="currency">${formatCurrency(
                    month.avgServiceValue
                  )}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="section-title">Estatísticas por Tipo de Serviço</div>
          <table>
            <thead>
              <tr>
                <th>Tipo de Serviço</th>
                <th>Quantidade</th>
                <th>Valor Total</th>
                <th>Porcentagem</th>
              </tr>
            </thead>
            <tbody>
              ${serviceTypeStats
                .map(
                  (type) => `
                <tr>
                  <td>${type.type}</td>
                  <td>${type.count}</td>
                  <td class="currency">${formatCurrency(type.totalAmount)}</td>
                  <td>${type.percentage.toFixed(1)}%</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Open in new window for printing/saving
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(reportContent);
        printWindow.document.close();
        printWindow.focus();

        // Trigger print dialog
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Erro ao gerar relatório PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Icons for buttons
  const PDFIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10,9 9,9 8,9" />
    </svg>
  );

  const LoadingIcon = () => (
    <svg
      className="animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-600 dark:text-gray-400">
          Carregando análises...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-red-500 bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          <strong>Erro:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl sm:text-2xl font-bold ">
            {isAdmin
              ? "Análises de Serviços (Admin - Todos os Serviços)"
              : "Análises de Serviços"}
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as PeriodType)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors text-sm"
            >
              <option value="3months">Últimos 3 meses</option>
              <option value="6months">Últimos 6 meses</option>
              <option value="12months">Últimos 12 meses</option>
              <option value="all">Todos os registros</option>
            </select>
            <button
              onClick={generatePDFReport}
              disabled={isGeneratingPDF}
              className={`${getButtonStyles(
                "pdf"
              )} w-full sm:w-auto justify-center`}
              title="Gerar relatório em PDF"
            >
              {isGeneratingPDF ? (
                <>
                  <LoadingIcon />
                  <span className="hidden sm:inline">Gerando...</span>
                  <span className="sm:hidden">Gerando PDF...</span>
                </>
              ) : (
                <>
                  <PDFIcon />
                  <span className="hidden sm:inline">Gerar PDF</span>
                  <span className="sm:hidden">PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Overall Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-gray-800 p-3 sm:p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
              {overallStats.totalServices}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Total de Serviços
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 sm:p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="text-sm sm:text-2xl font-bold text-green-600 dark:text-green-400 break-all">
              {formatCurrency(overallStats.totalAmount)}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Valor Total
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 sm:p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="text-lg sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
              {overallStats.pendingServices}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Serviços Pendentes
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 sm:p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="text-sm sm:text-2xl font-bold text-purple-600 dark:text-purple-400 break-all">
              {formatCurrency(overallStats.avgServiceValue)}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Valor Médio por Serviço
            </div>
          </div>
        </div>

        {/* User Statistics - Only for Admin */}
        {isAdmin && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">
                Estatísticas por Usuário
              </h3>
            </div>

            {/* Mobile Card View */}
            <div className="block sm:hidden divide-y divide-gray-200 dark:divide-gray-700">
              {userStats.map((userStat: UserStats) => (
                <div key={userStat.username} className="p-4 space-y-2">
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {userStat.username}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Serviços:{" "}
                      </span>
                      <span className="font-medium">
                        {userStat.serviceCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Total:{" "}
                      </span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(userStat.totalAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Autorizado:{" "}
                      </span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(userStat.authorizedAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Pendente:{" "}
                      </span>
                      <span className="font-medium text-orange-500 dark:text-orange-400">
                        {formatCurrency(userStat.pendingAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Qtd. Serviços
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Valor Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Autorizado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Pendente
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {userStats.map((userStat: UserStats) => (
                    <tr key={userStat.username}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {userStat.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {userStat.serviceCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(userStat.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(userStat.authorizedAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-orange-500 dark:text-orange-400">
                        {formatCurrency(userStat.pendingAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Monthly Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">
              Estatísticas Mensais
            </h3>
          </div>

          {/* Mobile Card View */}
          {/* Mobile Card View */}
          <div className="block sm:hidden divide-y divide-gray-200 dark:divide-gray-700">
            {monthlyStats.map((month) => (
              <div key={month.month} className="p-0">
                {/* Modern Month Header */}
                <div className="flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 dark:from-blue-900/40 dark:via-blue-800/40 dark:to-blue-900/40 border-b border-blue-200 dark:border-blue-700 rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-blue-900 dark:text-blue-200">
                      {formatMonth(month.month)}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-200 ml-1">
                      {month.serviceCount} serviço
                      {month.serviceCount > 1 ? "s" : ""}
                    </span>
                  </div>
                  <span className="text-green-700 dark:text-green-400 font-bold text-sm flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="inline-block"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M8 12h4a2 2 0 1 1 0 4h-2" />
                      <path d="M12 8v2" />
                    </svg>
                    {formatCurrency(month.totalAmount)}
                  </span>
                </div>
                {/* Stats */}
                <div className="p-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Autorizado:{" "}
                    </span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(month.authorizedAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Pendente:{" "}
                    </span>
                    <span className="font-medium text-orange-500 dark:text-orange-400">
                      {formatCurrency(month.pendingAmount)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 dark:text-gray-400">
                      Valor Médio:{" "}
                    </span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {formatCurrency(month.avgServiceValue)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Mês
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Qtd. Serviços
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Valor Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Autorizado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Pendente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Valor Médio
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {monthlyStats.map((month) => (
                  <tr key={month.month}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {formatMonth(month.month)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {month.serviceCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(month.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(month.authorizedAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-orange-500 dark:text-orange-400">
                      {formatCurrency(month.pendingAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {formatCurrency(month.avgServiceValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Service Type Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">
              Estatísticas por Tipo de Serviço
            </h3>
          </div>

          {/* Mobile Card View */}
          <div className="block sm:hidden divide-y divide-gray-200 dark:divide-gray-700">
            {serviceTypeStats.map((type) => (
              <div key={type.type} className="p-4 space-y-2">
                <div className="font-medium text-gray-900 dark:text-white text-sm">
                  {type.type}
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Quantidade:
                    </span>
                    <span className="font-medium">{type.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Valor Total:
                    </span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(type.totalAmount)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">
                        Porcentagem:
                      </span>
                      <span className="font-medium">
                        {type.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(type.percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tipo de Serviço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Quantidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Valor Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Porcentagem
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {serviceTypeStats.map((type) => (
                  <tr key={type.type}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {type.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {type.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(type.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(type.percentage, 100)}%`,
                            }}
                          ></div>
                        </div>
                        {type.percentage.toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 sm:p-4 rounded-lg">
            <div className="text-sm sm:text-lg font-semibold text-green-800 dark:text-green-300">
              Serviços Autorizados
            </div>
            <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
              {overallStats.authorizedServices}
            </div>
            <div className="text-xs sm:text-sm text-green-600 dark:text-green-400 break-all">
              {formatCurrency(overallStats.authorizedAmount)}
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-3 sm:p-4 rounded-lg">
            <div className="text-sm sm:text-lg font-semibold text-orange-800 dark:text-orange-300">
              Serviços Pendentes
            </div>
            <div className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
              {overallStats.pendingServices}
            </div>
            <div className="text-xs sm:text-sm text-orange-600 dark:text-orange-400 break-all">
              {formatCurrency(overallStats.pendingAmount)}
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 sm:p-4 rounded-lg">
            <div className="text-sm sm:text-lg font-semibold text-blue-800 dark:text-blue-300">
              Taxa de Aprovação
            </div>
            <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
              {overallStats.totalServices > 0
                ? (
                    (overallStats.authorizedServices /
                      overallStats.totalServices) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </div>
            <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
              {overallStats.authorizedServices} de {overallStats.totalServices}{" "}
              serviços
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTable;
