import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";

type ServiceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    serviceType: string,
    title: string,
    price: number,
    adminOverride?: boolean
  ) => Promise<void>;
  loading: boolean;
  error: string | null;
  isAdmin?: boolean;
};

const SERVICE_PRICES = {
  MONTAGEM: 5.0,
  ACRILIZAÇÃO: 5.0,
  BARRA: 6.0,
  "PLANO DE CERA": 2.0,
  PREPARO: 2.0,
  "2ª MONTAGEM": 2.5,
};

const SERVICE_OPTIONS = Object.keys(SERVICE_PRICES);

const ServiceModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  error,
  isAdmin = false,
}: ServiceModalProps) => {
  const [selectedServiceType, setSelectedServiceType] = useState(
    SERVICE_OPTIONS[0]
  );
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<number>(
    SERVICE_PRICES[SERVICE_OPTIONS[0] as keyof typeof SERVICE_PRICES]
  );
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [duplicateServices, setDuplicateServices] = useState<any[]>([]);
  const [adminOverride, setAdminOverride] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  // Update price when service type changes
  useEffect(() => {
    setPrice(
      SERVICE_PRICES[selectedServiceType as keyof typeof SERVICE_PRICES]
    );
  }, [selectedServiceType]);

  // Check for duplicates when title changes
  useEffect(() => {
    const checkDuplicates = async () => {
      if (title.trim() === "") {
        setIsDuplicate(false);
        setDuplicateServices([]);
        return;
      }

      setCheckingDuplicate(true);
      try {
        const { data, error } = await supabase
          .from("services")
          .select("*")
          .eq("title", title.trim());

        if (error) throw error;

        if (data && data.length > 0) {
          setIsDuplicate(true);
          setDuplicateServices(data);
        } else {
          setIsDuplicate(false);
          setDuplicateServices([]);
        }
      } catch (err) {
        console.error("Error checking duplicates:", err);
      } finally {
        setCheckingDuplicate(false);
      }
    };

    const timeoutId = setTimeout(checkDuplicates, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await onSubmit(selectedServiceType, title, price, adminOverride);
      resetForm();
      onClose();
    } catch {
      // Error is handled by parent component
    }
  };

  const resetForm = () => {
    setSelectedServiceType(SERVICE_OPTIONS[0]);
    setTitle("");
    setPrice(SERVICE_PRICES[SERVICE_OPTIONS[0] as keyof typeof SERVICE_PRICES]);
    setIsDuplicate(false);
    setDuplicateServices([]);
    setAdminOverride(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  // const canSubmit = true; 

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[500px]">
        <h3 className="text-lg font-semibold mb-4">Criar Novo Serviço</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Serviço
              </label>
              <select
                id="serviceType"
                value={selectedServiceType}
                onChange={(e) => setSelectedServiceType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                {SERVICE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Número/Código {checkingDuplicate && <span className="text-blue-500">(verificando...)</span>}
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Digite apenas números"
                pattern="[0-9]*"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  isDuplicate ? 'border-yellow-300 focus:ring-yellow-500' : 'border-gray-300 focus:ring-green-500'
                }`}
                required
              />
            </div>
          </div>

          {isDuplicate && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center mb-2">
                <div className="text-yellow-600 font-medium">
                  ⚠️ Número duplicado encontrado!
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-3">
                Este número já foi usado {duplicateServices.length} vez(es). O serviço será criado, mas {!adminOverride ? 'NÃO será incluído no total mensal' : 'SERÁ incluído no total mensal'}:
              </div>
              <div className="max-h-20 overflow-y-auto space-y-1">
                {duplicateServices.map((service, index) => (
                  <div key={index} className="text-xs text-gray-500 bg-white p-2 rounded">
                    {service.service_type}: {service.title} - {service.username} - {new Date(service.created_at).toLocaleDateString('pt-BR')}
                  </div>
                ))}
              </div>
              
              {isAdmin && (
                <div className="mt-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={adminOverride}
                      onChange={(e) => setAdminOverride(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-green-600">
                      Autorizar inclusão no total mensal (Admin)
                    </span>
                  </label>
                </div>
              )}
              
              {!isAdmin && (
                <div className="mt-3 text-sm text-orange-600">
                  Este serviço não será incluído no total mensal. Apenas administradores podem autorizar inclusão de duplicatas no total.
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Criando..." : "Criar Serviço"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceModal;