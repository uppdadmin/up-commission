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

  if (loading) return <div>Carregando...</div>;
  if (error) return <div className="text-red-500">Erro: {error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{getTitle()}</h2>
        {viewMode === "admin-pending" && (
          <div className="text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded">
            {services.length} serviço(s) aguardando autorização
          </div>
        )}
      </div>

      <div className="space-y-6">
        {groupedServices.map(([monthYear, { services: monthServices, total, pendingTotal }]) => (
          <div key={monthYear}>
            <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2 flex justify-between items-center">
              <span>
                {monthYear} ({monthServices.length} serviços)
                {monthYear === getCurrentMonth() && isAdmin && (viewMode === "admin-all" || viewMode === "admin-pending") && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Mês Atual - Exclusão Permitida
                  </span>
                )}
              </span>
              <div className="flex gap-4">
                {viewMode === "admin-all" && pendingTotal > 0 && (
                  <span className="text-orange-600 font-bold">
                    Pendente: {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(pendingTotal)}
                  </span>
                )}
                <span className="text-green-600 font-bold">
                  Total: {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(total)}
                </span>
              </div>
            </h3>
            
            <ul className="space-y-2">
              {monthServices.map((service) => (
                <li
                  key={service.id}
                  className={`p-4 rounded shadow flex flex-row items-center space-x-4 ${
                    service.include_in_total === false
                      ? "bg-yellow-50 border border-yellow-200"
                      : ""
                  }`}
                >
                  <div className="font-semibold w-1/6">
                    {service.service_type && (
                      <span className="text-blue-600 text-md mr-2">
                        {service.service_type}:
                      </span>
                    )}
                    {service.title}
                    {service.include_in_total === false && (
                      <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                        Não incluído no total
                      </span>
                    )}
                  </div>
                  
                  <div className="w-1/6 text-xs text-gray-500">
                    {service.username}
                  </div>
                  
                  <div className={`w-1/6 text-sm font-semibold ${
                    service.include_in_total === false ? 'text-gray-400' : 'text-green-600'
                  }`}>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(service.price || 0)}
                  </div>
                  
                  <div className="w-1/6 text-sm">
                    {new Date(service.created_at || "").toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </div>

                  {isAdmin && (viewMode === "admin-all" || viewMode === "admin-pending") && (
                    <div className="w-1/4 flex gap-2">
                      {/* Authorization buttons */}
                      {service.include_in_total === false ? (
                        <button
                          onClick={() => handleAuthorizeService(service.id)}
                          disabled={authorizingServices.has(service.id)}
                          className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50"
                        >
                          {authorizingServices.has(service.id) ? "Autorizando..." : "Autorizar"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRevokeAuthorization(service.id)}
                          disabled={authorizingServices.has(service.id)}
                          className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 disabled:opacity-50"
                        >
                          {authorizingServices.has(service.id) ? "Revogando..." : "Revogar"}
                        </button>
                      )}

                      {/* Delete button - only for current month */}
                      {isCurrentMonth(service.created_at || "") && (
                        <button
                          onClick={() => handleDeleteService(service.id, `${service.service_type}: ${service.title}`)}
                          disabled={deletingServices.has(service.id)}
                          className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50"
                        >
                          {deletingServices.has(service.id) ? "Excluindo..." : "Excluir"}
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryTable;