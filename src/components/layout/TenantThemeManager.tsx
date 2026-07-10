import React, { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useAppStore } from '../../store/useAppStore';
import { GET_TENANT_THEME } from '../../api/queries';

export const TenantThemeManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeTenantId, user, theme } = useAppStore();
  
  // Use either activeTenantId or fallback to the user's tenantId
  const tenantId = activeTenantId || user?.tenantId;

  const { data } = useQuery(GET_TENANT_THEME, {
    variables: { tenantId },
    skip: !tenantId,
    fetchPolicy: 'cache-first',
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    if (data?.tenantTheme) {
      const theme = data.tenantTheme;
      const root = document.documentElement;

      if (theme.primaryColor) {
        root.style.setProperty('--color-primary', theme.primaryColor);
        // compute dynamic primary gradients or lighter variants
        root.style.setProperty('--gradient-primary', `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.primaryColor}dd 100%)`);
      }
      if (theme.primaryColorDark) {
        root.style.setProperty('--color-primary-dark', theme.primaryColorDark);
      }
      if (theme.secondaryColor) {
        root.style.setProperty('--color-secondary', theme.secondaryColor);
      }
      if (theme.borderRadius) {
        root.style.setProperty('--radius-md', theme.borderRadius);
      }
    } else {
      // Reset back to defaults if no custom tenant theme is found
      const root = document.documentElement;
      root.style.removeProperty('--color-primary');
      root.style.removeProperty('--color-primary-dark');
      root.style.removeProperty('--color-secondary');
      root.style.removeProperty('--radius-md');
      root.style.removeProperty('--gradient-primary');
    }
  }, [data]);

  return <>{children}</>;
};

export default TenantThemeManager;
