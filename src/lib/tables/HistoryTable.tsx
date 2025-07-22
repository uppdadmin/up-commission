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

type HistoryTableProps = {
  viewMode?: "default" | "admin-all" | "admin-pending";
};

const HistoryTable = ({ viewMode = "default" }: HistoryTableProps) => {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authorizingServices, setAuthorizingServices] = useState<Set<string>>(new Set());
  const [deletingServices, setDeletingServices] = useState<Set<string>>(new Set());

  // Button styling function
  const getButtonStyles = (variant: 'authorize' | 'revoke' | 'delete') => {
    const baseStyles = "group flex items-center justify-center gap-1 px-3 py-1 rounded-lg font-semibold text-xs transition-all duration-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 border-b-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-0";
    
    switch (variant) {
      case 'authorize':
        return `${baseStyles} bg-green-600 dark:text-white border-green-800 hover:bg-green-700 active:bg-green-800 focus-visible:outline-green-500 disabled:bg-green-600 disabled:text-white`;
      case 'revoke':
        return `${baseStyles} bg-orange-600 dark:text-white border-orange-800 hover:bg-orange-700 active:bg-orange-800 focus-visible:outline-orange-500 disabled:bg-orange-600 disabled:text-white`;
      case 'delete':
        return `${baseStyles} bg-red-600 dark:text-white border-red-800 hover:bg-red-700 active:bg-red-800 focus-visible:outline-red-500 disabled:bg-red-600 disabled:text-white`;
      default:
        return baseStyles;
    }
  };

  useEffect(() => {
    fetchServices();
  }, [user, viewMode]);

  const fetchServices = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: false });

      // Filter based on view mode
      if (viewMode === "default") {
        query = query.eq("user_id", user.id);
      } else if (viewMode === "admin-pending") {
        query = query.eq("include_in_total", false);
      }
      // For admin-all, we don't add any filters to get all services

      const { data, error } = await query;

      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar serviços");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorizeService = async (serviceId: string) => {
    if (!isAdmin) return;

    setAuthorizingServices(prev => new Set(prev).add(serviceId));
    
    try {
      const { error } = await supabase
        .from("services")
        .update({ 
          include_in_total: true,
          admin_override: true
        })
        .eq("id", serviceId);

      if (error) throw error;

      // Update local state
      setServices(prev => 
        prev.map(service => 
          service.id === serviceId 
            ? { ...service, include_in_total: true, admin_override: true }
            : service
        )
      );
    } catch (err) {
      console.error("Error authorizing service:", err);
      alert("Erro ao autorizar serviço");
    } finally {
      setAuthorizingServices(prev => {
        const newSet = new Set(prev);
        newSet.delete(serviceId);
        return newSet;
      });
    }
  };

  const handleRevokeAuthorization = async (serviceId: string) => {
    if (!isAdmin) return;

    setAuthorizingServices(prev => new Set(prev).add(serviceId));
    
    try {
      const { error } = await supabase
        .from("services")
        .update({ 
          include_in_total: false,
          admin_override: false
        })
        .eq("id", serviceId);

      if (error) throw error;

      // Update local state
      setServices(prev => 
        prev.map(service => 
          service.id === serviceId 
            ? { ...service, include_in_total: false, admin_override: false }
            : service
        )
      );
    } catch (err) {
      console.error("Error revoking authorization:", err);
      alert("Erro ao revogar autorização");
    } finally {
      setAuthorizingServices(prev => {
        const newSet = new Set(prev);
        newSet.delete(serviceId);
        return newSet;
      });
    }
  };

  const handleDeleteService = async (serviceId: string, serviceTitle: string) => {
    if (!isAdmin) return;

    const confirmDelete = window.confirm(
      `Tem certeza de que deseja excluir o serviço "${serviceTitle}"? Esta ação não pode ser desfeita.`
    );

    if (!confirmDelete) return;

    setDeletingServices(prev => new Set(prev).add(serviceId));
    
    try {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", serviceId);

      if (error) throw error;

      // Remove from local state
      setServices(prev => prev.filter(service => service.id !== serviceId));
    } catch (err) {
      console.error("Error deleting service:", err);
      alert("Erro ao excluir serviço");
    } finally {
      setDeletingServices(prev => {
        const newSet = new Set(prev);
        newSet.delete(serviceId);
        return newSet;
      });
    }
  };

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  };

  const isCurrentMonth = (serviceDate: string) => {
    const date = new Date(serviceDate);
    const serviceMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return serviceMonth === getCurrentMonth();
  };

  const groupedServices = useMemo(() => {
    const grouped = services.reduce((acc, service) => {
      const date = new Date(service.created_at || "");
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      
      if (!acc[monthYear]) {
        acc[monthYear] = { services: [], total: 0, pendingTotal: 0 };
      }
      
      acc[monthYear].services.push(service);
      
      if (service.include_in_total !== false) {
        acc[monthYear].total += service.price || 0;
      } else {
        acc[monthYear].pendingTotal += service.price || 0;
      }
      
      return acc;
    }, {} as Record<string, { services: Service[]; total: number; pendingTotal: number }>);

    return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));
  }, [services]);

  const getTitle = () => {
    switch (viewMode) {
      case "admin-all":
        return "Todos os Serviços (Admin)";
      case "admin-pending":
        return "Serviços Pendentes de Autorização (Admin)";
      default:
        return "Histórico de Serviços";
    }
  };

  // Icons for buttons
  const AuthorizeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12l2 2 4-4"/>
      <circle cx="12" cy="12" r="10"/>
    </svg>
  );

  const RevokeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="m15 9-6 6"/>
      <path d="m9 9 6 6"/>
    </svg>
  );

  const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18"/>
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    </svg>
  );

  const LoadingIcon = () => (
    <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 11-6.219-8.56"/>
    </svg>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-600 dark:text-gray-400">Carregando histórico...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          <strong>Erro:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{getTitle()}</h2>
        {viewMode === "admin-pending" && (
          <div className="text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded border border-orange-200 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400">
            {services.length} serviço(s) aguardando autorização
          </div>
        )}
      </div>

      <div className="space-y-6">
        {groupedServices.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 text-lg">
              {viewMode === "admin-pending" 
                ? "Nenhum serviço pendente encontrado" 
                : "Nenhum serviço encontrado no histórico"
              }
            </div>
          </div>
        ) : (
          groupedServices.map(([monthYear, { services: monthServices, total, pendingTotal }]) => (
            <div key={monthYear} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <span className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                      {new Date(monthYear + '-01').toLocaleDateString('pt-BR', { 
                        month: 'long', 
                        year: 'numeric' 
                      })} ({monthServices.length} serviços)
                    </span>
                    {monthYear === getCurrentMonth() && isAdmin && (viewMode === "admin-all" || viewMode === "admin-pending") && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded dark:bg-blue-900/20 dark:text-blue-400">
                        Mês Atual - Exclusão Permitida
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {viewMode === "admin-all" && pendingTotal > 0 && (
                      <span className="text-orange-600 font-bold dark:text-orange-400">
                        Pendente: {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(pendingTotal)}
                      </span>
                    )}
                    <span className="text-green-600 font-bold dark:text-green-400">
                      Total: {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(total)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {monthServices.map((service) => (
                  <div
                    key={service.id}
                    className={`p-4 flex flex-col lg:flex-row items-start lg:items-center gap-4 transition-colors ${
                      service.include_in_total === false
                        ? "bg-yellow-50 dark:bg-yellow-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {service.service_type && (
                          <span className="text-blue-600 dark:text-blue-400 text-sm mr-2">
                            {service.service_type}:
                          </span>
                        )}
                        {service.title}
                        {service.include_in_total === false && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
                            Não incluído no total
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Por: {service.username}
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
                      <div className={`text-sm font-semibold ${
                        service.include_in_total === false 
                          ? 'text-gray-400 dark:text-gray-500' 
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(service.price || 0)}
                      </div>
                      
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(service.created_at || "").toLocaleString("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </div>

                      {isAdmin && (viewMode === "admin-all" || viewMode === "admin-pending") && (
                        <div className="flex flex-wrap gap-2">
                          {/* Authorization buttons */}
                          {service.include_in_total === false ? (
                            <button
                              onClick={() => handleAuthorizeService(service.id)}
                              disabled={authorizingServices.has(service.id)}
                              className={getButtonStyles('authorize')}
                              title="Autorizar inclusão no total"
                            >
                              {authorizingServices.has(service.id) ? (
                                <>
                                  <LoadingIcon />
                                  <span>Autorizando...</span>
                                </>
                              ) : (
                                <>
                                  <AuthorizeIcon />
                                  <span>Autorizar</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRevokeAuthorization(service.id)}
                              disabled={authorizingServices.has(service.id)}
                              className={getButtonStyles('revoke')}
                              title="Revogar autorização"
                            >
                              {authorizingServices.has(service.id) ? (
                                <>
                                  <LoadingIcon />
                                  <span>Revogando...</span>
                                </>
                              ) : (
                                <>
                                  <RevokeIcon />
                                  <span>Revogar</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Delete button - only for current month */}
                          {isCurrentMonth(service.created_at || "") && (
                            <button
                              onClick={() => handleDeleteService(service.id, `${service.service_type}: ${service.title}`)}
                              disabled={deletingServices.has(service.id)}
                              className={getButtonStyles('delete')}
                              title="Excluir serviço permanentemente"
                            >
                              {deletingServices.has(service.id) ? (
                                <>
                                  <LoadingIcon />
                                  <span>Excluindo...</span>
                                </>
                              ) : (
                                <>
                                  <DeleteIcon />
                                  <span>Excluir</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryTable;