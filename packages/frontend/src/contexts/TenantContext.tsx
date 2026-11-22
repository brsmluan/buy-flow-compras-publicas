// =============================================================================
// BUY-FLOW FRONTEND - Tenant Context (Multi-tenancy)
// =============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { Tenant } from '@buy-flow/shared/index.js';

interface TenantState {
  currentTenant: Tenant | null;
  availableTenants: Tenant[];
  isLoading: boolean;
  setCurrentTenant: (tenantId: string) => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
  refreshTenants: () => Promise<void>;
}

const TenantContext = createContext<TenantState | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [currentTenant, setCurrentTenantState] = useState<Tenant | null>(null);
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const response = await api.get<Tenant[]>('/tenants');
      const tenants = response.data;
      setAvailableTenants(tenants);

      // Set current tenant from localStorage or first available
      const storedTenantId = localStorage.getItem('currentTenantId');
      if (storedTenantId) {
        const tenant = tenants.find(t => t.id === storedTenantId);
        if (tenant) setCurrentTenantState(tenant);
      } else if (tenants.length > 0) {
        setCurrentTenantState(tenants[0]);
        localStorage.setItem('currentTenantId', tenants[0].id);
      }
    } catch (error) {
      console.error('Failed to load tenants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrentTenant = useCallback(async (tenantId: string) => {
    const tenant = availableTenants.find(t => t.id === tenantId);
    if (tenant) {
      setCurrentTenantState(tenant);
      localStorage.setItem('currentTenantId', tenantId);
      // Add tenant header to API requests
      api.defaults.headers.common['X-Tenant-ID'] = tenantId;
    }
  }, [availableTenants]);

  const switchTenant = useCallback(async (tenantId: string) => {
    await setCurrentTenant(tenantId);
    // Reload data for new tenant
    window.location.reload();
  }, [setCurrentTenant]);

  const refreshTenants = useCallback(async () => {
    await loadTenants();
  }, []);

  return (
    <TenantContext.Provider value={{
      currentTenant,
      availableTenants,
      isLoading,
      setCurrentTenant,
      switchTenant,
      refreshTenants,
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}