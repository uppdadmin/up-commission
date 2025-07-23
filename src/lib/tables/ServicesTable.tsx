import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useUser } from "@clerk/clerk-react";
import ServiceModal from "../components/ServiceModal";
import {
  getButtonStyles,
  buttonPresets,
} from "../components/shared/ButtonSchema";

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Add error checking for environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

type Service = {
  include_in_total: boolean;
  id: string;
  title: string;
  service_type?: string;
  user_id: string;
  username: string;
  created_at?: string;
  price?: number;
  admin_override?: boolean;
};

const ServicesTable = () => {
  const { user } = useUser();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Button styling function
  // const getButtonStyles = (variant: 'create' | 'refresh') => {
  //   const baseStyles = "group flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 shadow-md border-b-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-0";

  //   switch (variant) {
  //     case 'create':
  //       return `${baseStyles} bg-green-600 text-white border-green-800 hover:bg-green-700 active:bg-green-800 focus-visible:outline-green-500`;
  //     case 'refresh':
  //       return `${baseStyles} bg-[#55a6e0] text-white border-blue-800 hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-blue-500`;
  //     default:
  //       return `${baseStyles} bg-gray-600 text-white border-gray-800 hover:bg-gray-700 active:bg-gray-800 focus-visible:outline-gray-500`;
  //   }
  // };

  const groupedServices = useMemo(() => {
    const grouped = services.reduce((acc, service) => {
      const date = new Date(service.created_at || "");
      const monthYear = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!acc[monthYear]) {
        acc[monthYear] = { services: [], total: 0 };
      }

      acc[monthYear].services.push(service);

      // Only include in total if include_in_total is true or admin_override is true
      if (service.include_in_total !== false) {
        acc[monthYear].total += service.price || 0;
      }

      return acc;
    }, {} as Record<string, { services: Service[]; total: number }>);

    return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));
  }, [services]);

  useEffect(() => {
    const fetchServices = async () => {
      if (!user) return;

      setLoading(true);
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        setError(error.message);
      } else {
        setServices(data || []);
      }
      setLoading(false);
    };
    fetchServices();
  }, [user]);

  const handleCreateService = async (
    serviceType: string,
    title: string,
    price: number,
    adminOverride: boolean = false
  ) => {
    if (!user) {
      setModalError("Usuário não autenticado");
      return;
    }

    setModalLoading(true);
    setModalError(null);

    try {
      if (!title.trim()) {
        throw new Error("O número/código é obrigatório");
      }
      if (price < 0) {
        throw new Error("O preço deve ser maior ou igual a zero");
      }

      const { data: existingServices } = await supabase
        .from("services")
        .select("*")
        .eq("title", title.trim());

      const isDuplicate = existingServices && existingServices.length > 0;

      const { data, error } = await supabase
        .from("services")
        .insert([
          {
            title: title.trim(),
            service_type: serviceType,
            price: price,
            user_id: user.id,
            username: user.username || user.firstName || "Unknown",
            admin_override: adminOverride,
            include_in_total: !isDuplicate || adminOverride,
          },
        ])
        .select();

      if (error) {
        throw new Error(error.message);
      }

      if (data && data.length > 0) {
        setServices((prev) => [...prev, ...data]);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      setModalError(errorMessage);
      throw err;
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenModal = () => {
    if (!user) {
      setError("Usuário não autenticado");
      return;
    }
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalError(null);
    setIsModalOpen(false);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Icons for buttons
  const CreateIcon = () => (
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
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );

  const RefreshIcon = () => (
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
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );

  // Show loading while user is being loaded
  if (!user) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-600 dark:text-gray-400">
          Carregando usuário...
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-600 dark:text-gray-400">
          Carregando Serviços...
        </div>
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
    <div className="p-4 sm:p-6">
      {/* Header with Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold">
          Serviços
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            className={`${getButtonStyles("create", "md", true)} sm:w-auto`}
            onClick={handleOpenModal}
            disabled={!user}
          >
            <CreateIcon />
            <span>Criar Serviço</span>
          </button>
          <button
            className={`${getButtonStyles("refresh", "md", true)} sm:w-auto`}
            onClick={handleRefresh}
            title="Atualizar lista de serviços"
          >
            <RefreshIcon />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Services Content */}
      {groupedServices.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 text-base sm:text-lg mb-4">
            Nenhum serviço encontrado
          </div>
          <button
            className={buttonPresets.createService()}
            onClick={handleOpenModal}
          >
            <CreateIcon />
            <span>Criar Primeiro Serviço</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {groupedServices.map(
            ([monthYear, { services: monthServices, total }]) => (
              <div
                key={monthYear}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-6 py-4 bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 dark:from-blue-900/40 dark:via-blue-800/40 dark:to-blue-900/40 border-b border-blue-200 dark:border-blue-700 rounded-t-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-lg sm:text-xl font-bold text-blue-900 dark:text-blue-200">
                      {new Date(monthYear + "-01").toLocaleDateString("pt-BR", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-200 ml-2">
                      {monthServices.length} serviço
                      {monthServices.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <span className="text-green-700 dark:text-green-400 font-bold text-base sm:text-lg flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      className="lucide lucide-badge-dollar-sign-icon lucide-badge-dollar-sign"
                    >
                      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                      <path d="M12 18V6" />
                    </svg>
                    Total:{" "}
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(total)}
                  </span>
                </div>

                {/* Mobile Card View */}
                <div className="block sm:hidden">
                  {monthServices.map((service, index) => (
                    <div key={service.id}>
                      <div
                        className={`p-4 transition-colors ${
                          service.include_in_total === false
                            ? "bg-yellow-50 dark:bg-yellow-900/20"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        }`}
                      >
                        {/* Header with Number and Price */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="bg-blue-500 text-white px-3 py-1.5 rounded-lg font-mono text-sm font-semibold">
                              #{service.title}
                            </span>
                          </div>
                          <div
                            className={`text-base font-bold ${
                              service.include_in_total === false
                                ? "text-gray-400 dark:text-gray-500"
                                : "text-green-600 dark:text-green-400"
                            }`}
                          >
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(service.price || 0)}
                          </div>
                        </div>

                        {/* Service Info */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Tipo:
                            </span>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {service.service_type || "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Por:
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {service.username}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Data:
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(
                                service.created_at || ""
                              ).toLocaleString("pt-BR", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Status Tags */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {service.include_in_total === false && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
                              Não incluído no total
                            </span>
                          )}
                          {service.admin_override && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                              Admin Override
                            </span>
                          )}
                        </div>
                      </div>
                      {index < monthServices.length - 1 && (
                        <div className="border-b border-gray-100 dark:border-gray-700"></div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop List View */}
                <div className="hidden sm:block">
                  {monthServices.map((service, index) => (
                    <div key={service.id}>
                      <div
                        className={`p-4 sm:p-6 transition-colors ${
                          service.include_in_total === false
                            ? "bg-yellow-50 dark:bg-yellow-900/20"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          {/* Left Side - Number and Details */}
                          <div className="flex items-center gap-4 sm:gap-6 flex-1">
                            {/* Service Number Badge */}
                            <div className="flex-shrink-0">
                              <span className="bg-[#0e73b9] text-white px-3 py-2 rounded-lg font-mono text-base font-semibold">
                                #{service.title}
                              </span>
                            </div>

                            {/* Service Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {service.service_type || "N/A"}
                                </span>
                                <span className="text-gray-300 dark:text-gray-600">
                                  •
                                </span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {service.username}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(
                                  service.created_at || ""
                                ).toLocaleString("pt-BR", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Right Side - Price */}
                          <div className="flex-shrink-0">
                            <div
                              className={`text-lg font-bold ${
                                service.include_in_total === false
                                  ? "text-gray-400 dark:text-gray-500"
                                  : "text-green-600 dark:text-green-400"
                              }`}
                            >
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(service.price || 0)}
                            </div>
                          </div>
                        </div>

                        {/* Status Tags Row */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {service.include_in_total === false && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
                              Não incluído no total
                            </span>
                          )}
                          {service.admin_override && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                              Admin Override
                            </span>
                          )}
                        </div>
                      </div>
                      {index < monthServices.length - 1 && (
                        <div className="border-b border-gray-100 dark:border-gray-700"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}

      <ServiceModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateService}
        loading={modalLoading}
        error={modalError}
        isAdmin={user?.publicMetadata?.role === "admin"}
      />
    </div>
  );
};

export default ServicesTable;
