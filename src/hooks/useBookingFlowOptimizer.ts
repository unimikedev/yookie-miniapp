import { useMemo, useState } from 'react';

interface Master {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
}

interface UseBookingFlowOptimizerProps {
  masters: Master[];
  services: Service[];
  isSingleMaster?: boolean;
}

export const useBookingFlowOptimizer = ({ 
  masters, 
  services,
  isSingleMaster = false 
}: UseBookingFlowOptimizerProps) => {
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // Auto-select single master
  useMemo(() => {
    if (isSingleMaster && masters.length === 1 && !selectedMasterId) {
      setSelectedMasterId(masters[0].id);
    }
  }, [isSingleMaster, masters.length, selectedMasterId, masters]);

  // Get available masters for selected service
  const getAvailableMastersForService = (serviceId: string): Master[] => {
    // In real app, this would filter based on service-master compatibility
    return masters;
  };

  // Get available services for selected master
  const getAvailableServicesForMaster = (masterId: string): Service[] => {
    // In real app, this would filter based on master-service compatibility
    return services;
  };

  const isMasterSelectionRequired = !isSingleMaster && masters.length > 1;
  const canProceedToDateTime = selectedServiceId !== null && selectedMasterId !== null;

  return {
    selectedMasterId,
    selectedServiceId,
    setSelectedMasterId,
    setSelectedServiceId,
    isSingleMaster,
    isMasterSelectionRequired,
    canProceedToDateTime,
    getAvailableMastersForService,
    getAvailableServicesForMaster,
    mastersCount: masters.length,
    servicesCount: services.length,
  };
};
