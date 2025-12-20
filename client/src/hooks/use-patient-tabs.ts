import { useQuery } from '@tanstack/react-query';
import { t } from '@/lib/i18n';
import { SYSTEM_TAB_REGISTRY, getTabLabel } from '@/components/patient-tabs/dynamic-tab-registry';

export interface TabConfig {
  id: number;
  key: string;
  label: string;
  icon: string;
  contentType: string;
  settings: Record<string, any>;
  displayOrder: number;
  isVisible: boolean;
  isSystemDefault: boolean;
  scope: string;
  isMandatory?: boolean;
  category?: string;
}

/**
 * Get fallback tabs with internationalized labels
 */
function getFallbackTabs(): TabConfig[] {
  const tabKeys = ['overview', 'visits', 'lab', 'medications', 'vitals', 'documents', 'billing', 'insurance', 'appointments', 'history', 'med-reviews', 'communication', 'immunizations', 'timeline', 'safety', 'specialty', 'allergies', 'imaging', 'procedures', 'referrals', 'care-plans', 'notes'];
  const icons = ['User', 'Calendar', 'TestTube', 'Pill', 'Activity', 'FileText', 'CreditCard', 'Shield', 'CalendarDays', 'History', 'FileCheck', 'MessageSquare', 'Syringe', 'Clock', 'Shield', 'Stethoscope', 'AlertTriangle', 'Scan', 'Scissors', 'Users', 'ClipboardList', 'BookOpen'];
  const displayOrders = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220];
  
  return tabKeys.map((key, index) => {
    const systemTab = SYSTEM_TAB_REGISTRY[key];
    const label = systemTab ? getTabLabel(systemTab) : t(`tab.${key}`);
    
    return {
      id: -(index + 1),
      key,
      label,
      icon: icons[index],
      contentType: 'builtin_component',
      settings: {},
      displayOrder: displayOrders[index],
      isVisible: true,
      isSystemDefault: true,
      scope: 'system',
    };
  });
}

// Bidirectional key mapping
const SERVER_TO_UI_KEY_MAP: Record<string, string> = {
  'visits': 'record-visit',
  'lab': 'labs',
};

const UI_TO_SERVER_KEY_MAP: Record<string, string> = {
  'record-visit': 'visits',
  'labs': 'lab',
};

export function mapServerKeyToUiKey(serverKey: string): string {
  return SERVER_TO_UI_KEY_MAP[serverKey] || serverKey;
}

export function mapUiKeyToServerKey(uiKey: string): string {
  return UI_TO_SERVER_KEY_MAP[uiKey] || uiKey;
}

export function usePatientTabs() {
  const { data: tabs, isLoading, isError } = useQuery<TabConfig[]>({
    queryKey: ['/api/tab-configs'],
    retry: 1,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    // Don't fail completely if API errors - use fallback
    throwOnError: false,
  });

  const fallbackTabs = getFallbackTabs();
  // Use fallback if API fails or returns empty array
  const effectiveTabs = (isError || !tabs || tabs.length === 0) ? fallbackTabs : tabs;
  
  const visibleTabs = effectiveTabs
    .filter(tab => tab.isVisible)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(tab => {
      // Translate label if it's a system tab and hasn't been customized
      const systemTab = SYSTEM_TAB_REGISTRY[tab.key];
      const translatedLabel = systemTab && tab.isSystemDefault 
        ? getTabLabel(systemTab)
        : tab.label;
      
      return {
        ...tab,
        key: mapServerKeyToUiKey(tab.key),
        label: translatedLabel,
      };
    });

  const defaultTabKey = visibleTabs.length > 0 ? visibleTabs[0].key : 'overview';

  return {
    tabs: visibleTabs,
    isLoading,
    isError,
    defaultTabKey,
    mapServerKeyToUiKey,
    mapUiKeyToServerKey,
  };
}
