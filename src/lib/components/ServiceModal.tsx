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

  // Button styling function
  const getButtonStyles = (variant: 'primary' | 'secondary' | 'cancel') => {
    const baseStyles = "group flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 border-b-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-0";
    
    switch (variant) {
      case 'primary':
        return `${baseStyles} bg-green-600 text-green-600 dark:text-white border-green-800 hover:bg-green-700 active:bg-green-800 focus-visible:outline-green-500 disabled:bg-green-600 disabled:text-white`;
      case 'secondary':
        return `${baseStyles} bg-blue-600 text-blue-600 dark:text-white border-blue-800 hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-blue-500 disabled:bg-blue-600 disabled:text-white`;
      case 'cancel':
        return `${baseStyles} bg-gray-600 text-gray-600 dark:text-white border-gray-800 hover:bg-gray-700 active:bg-gray-800 focus-visible:outline-gray-500 disabled:bg-gray-600 disabled:text-white`;
      default:
        return baseStyles;
    }
  };

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

  // Loading Icon
  const LoadingIcon = () => (
    <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 11-6.219-8.56"/>
    </svg>
  );

  // Close Icon
  const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m18 6-12 12"/>
      <path d="m6 6 12 12"/>
    </svg>
  );

  // Create Icon
  const CreateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/>
      <path d="m12 5 7 7-7 7"/>
    </svg>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Criar Novo Serviço
          </h3>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Fechar"
          >
            <CloseIcon />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service Type and Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Serviço
              </label>
              <select
                id="serviceType"
                value={selectedServiceType}
                onChange={(e) => setSelectedServiceType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                required
                disabled={loading}
              >
                {SERVICE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número/Código {checkingDuplicate && <span className="text-blue-500">(verificando...)</span>}
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Digite apenas números"
                pattern="[0-9]*"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white transition-colors ${
                  isDuplicate 
                    ? 'border-yellow-300 focus:ring-yellow-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-green-500'
                }`}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Price Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preço
            </label>
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-green-600 dark:text-green-400 font-semibold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(price)}
            </div>
          </div>

          {/* Duplicate Warning */}
          {isDuplicate && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <div className="flex items-center mb-2">
                <div className="text-yellow-600 dark:text-yellow-400 font-medium">
                  ⚠️ Número duplicado encontrado!
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Este número já foi usado {duplicateServices.length} vez(es). O serviço será criado, mas {!adminOverride ? 'NÃO será incluído no total mensal' : 'SERÁ incluído no total mensal'}:
              </div>
              <div className="max-h-20 overflow-y-auto space-y-1">
                {duplicateServices.map((service, index) => (
                  <div key={index} className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 p-2 rounded border">
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
                      className="mr-2 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      disabled={loading}
                    />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      Autorizar inclusão no total mensal (Admin)
                    </span>
                  </label>
                </div>
              )}
              
              {!isAdmin && (
                <div className="mt-3 text-sm text-orange-600 dark:text-orange-400">
                  Este serviço não será incluído no total mensal. Apenas administradores podem autorizar inclusão de duplicatas no total.
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="text-red-600 dark:text-red-400 text-sm font-medium">
                {error}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className={getButtonStyles('cancel')}
              disabled={loading}
            >
              <CloseIcon />
              <span>Cancelar</span>
            </button>
            <button
              type="submit"
              className={getButtonStyles('primary')}
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoadingIcon />
                  <span>Criando...</span>
                </>
              ) : (
                <>
                  <CreateIcon />
                  <span>Criar Serviço</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceModal;