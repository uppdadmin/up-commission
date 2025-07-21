import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useUser } from "@clerk/clerk-react";
import ServiceModal from "../components/ServiceModal";

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Add error checking for environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
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
  admin_override?: boolean; // Add this field
};

const ServicesTable = () => {
  const { user } = useUser();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

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
      if (!user) return; // Don't fetch if no user

      setLoading(true);
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("user_id", user.id); // Only fetch services for current user

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

      // Check if it's a duplicate
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
            include_in_total: !isDuplicate || adminOverride, // Add this field to track if it should be included in totals
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

  // Show loading while user is being loaded
  if (!user) {
    return <div>Carregando usuário...</div>;
  }

  if (loading) {
    return <div>Carregando Serviços...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between py-7">
        <h2 className="font-bold text-xl">Serviços</h2>
        <div className="">
          <button
            className="py-1 px-6 bg-green-500 text-white rounded hover:bg-green-700 mr-2"
            onClick={handleOpenModal}
          >
            Criar Serviço
          </button>
          <button
            className="py-1 px-6 bg-blue-300 text-white rounded hover:bg-blue-700"
            onClick={() => window.location.reload()}
          >
            Atualizar
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {groupedServices.map(
          ([monthYear, { services: monthServices, total }]) => (
            <div key={monthYear}>
              <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2 flex justify-between items-center">
                <span>
                  {monthYear} ({monthServices.length} serviços)
                </span>
                <span className="text-green-600 font-bold">
                  Total:{" "}
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(total)}
                </span>
              </h3>
              <ul className="space-y-2">
                {monthServices.map((service) => (
                  <li
                    key={service.id}
                    className={`p-4 rounded shadow flex flex-row items-center space-x-8 ${
                      service.include_in_total === false
                        ? "bg-yellow-50 border border-yellow-200"
                        : ""
                    }`}
                  >
                    <div className="font-semibold w-1/4">
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
                    <div
                      className={`w-1/6 text-sm font-semibold ${
                        service.include_in_total === false
                          ? "text-gray-400"
                          : "text-green-600"
                      }`}
                    >
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(service.price || 0)}
                    </div>
                    <div className="w-1/4 text-sm">
                      {new Date(service.created_at || "").toLocaleString(
                        "pt-BR",
                        {
                          dateStyle: "short",
                          timeStyle: "short",
                        }
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )
        )}
      </div>

      <ServiceModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateService}
        loading={modalLoading}
        error={modalError}
        isAdmin={user?.publicMetadata?.role === "admin"} // Pass admin status
      />
    </div>
  );
};

export default ServicesTable;