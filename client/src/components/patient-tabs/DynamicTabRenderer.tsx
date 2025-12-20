import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Settings2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { SYSTEM_TAB_REGISTRY, TabRenderProps, getTabIcon } from './dynamic-tab-registry';
import { TabManager } from '../tab-manager';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface TabConfig {
  id: number;
  key: string;
  label: string;
  icon: string;
  contentType: string;
  settings: any;
  isVisible: boolean;
  isSystemDefault: boolean;
  displayOrder: number;
  scope: string;
}

interface DynamicTabRendererProps extends TabRenderProps {
  patient: any;
  defaultTab?: string;
}

export function DynamicTabRenderer({ patient, defaultTab = 'overview', ...props }: DynamicTabRendererProps) {
  const [showTabManager, setShowTabManager] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tabsListRef = useRef<HTMLDivElement>(null);

  // Fetch tab configurations from API
  const { data: tabConfigs, isLoading, isError } = useQuery<TabConfig[]>({
    queryKey: ['/api/tab-configs'],
    retry: 1,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    throwOnError: false, // Don't throw - use fallback instead
  });

  // Merge API configs with system registry
  // Fall back to registry defaults if API fails
  const resolvedTabs = useMemo(() => {
    // Use API tabs if available, otherwise fall back to system registry
    const tabs = (tabConfigs && tabConfigs.length > 0 && !isError)
      ? tabConfigs
          .filter(tab => tab.isVisible)
          .sort((a, b) => a.displayOrder - b.displayOrder)
      : Object.values(SYSTEM_TAB_REGISTRY).map((tab, index) => ({
          id: -(index + 1), // Negative IDs for fallback tabs
          key: tab.key,
          label: tab.defaultLabel,
          icon: tab.icon.name,
          contentType: 'builtin_component',
          settings: {},
          isVisible: true,
          isSystemDefault: true,
          displayOrder: (index + 1) * 10,
          scope: 'system',
        }));
    
    // Debug: Log tabs count
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Tabs] Rendering ${tabs.length} tabs:`, tabs.map(t => `${t.key}(${t.label})`).join(', '));
      if (isError) {
        console.warn('[Tabs] API error, using fallback tabs');
      }
      if (!tabConfigs || tabConfigs.length === 0) {
        console.warn('[Tabs] No tabs from API, using fallback tabs');
      }
    }
    
    return tabs;
  }, [tabConfigs, isError]);

  // Check scroll position
  const checkScroll = () => {
    const element = tabsListRef.current;
    if (element) {
      const hasScrollLeft = element.scrollLeft > 5; // Small threshold to avoid flickering
      const hasScrollRight = element.scrollLeft < element.scrollWidth - element.clientWidth - 5;
      setCanScrollLeft(hasScrollLeft);
      setCanScrollRight(hasScrollRight);
    }
  };

  // Handle scroll navigation
  const scrollTabs = (direction: 'left' | 'right') => {
    const element = tabsListRef.current;
    if (element) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      element.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Monitor scroll position
  useEffect(() => {
    const element = tabsListRef.current;
    if (element) {
      checkScroll();
      element.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        element.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [resolvedTabs]);

  // Sanitize and render markdown content safely
  function sanitizeMarkdown(markdown: string): string {
    try {
      // Convert markdown to HTML
      const rawHtml = marked.parse(markdown) as string;
      // Sanitize HTML to prevent XSS
      const cleanHtml = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'br', 'ul', 'ol', 'li',
          'strong', 'em', 'code', 'pre',
          'blockquote', 'a', 'img',
          'table', 'thead', 'tbody', 'tr', 'th', 'td'
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      });
      return cleanHtml;
    } catch (error) {
      console.error('Error sanitizing markdown:', error);
      return '<p>Error rendering content</p>';
    }
  }

  // Render tab content based on content type
  function renderTabContent(tab: TabConfig): JSX.Element {
    // Builtin component - use system registry
    if (tab.contentType === 'builtin_component' && SYSTEM_TAB_REGISTRY[tab.key]) {
      const systemTab = SYSTEM_TAB_REGISTRY[tab.key];
      return systemTab.render({ patient, ...props });
    }

    // Markdown content - sanitized
    if (tab.contentType === 'markdown') {
      const sanitizedHtml = sanitizeMarkdown(tab.settings?.markdown || '# No Content\n\nThis tab is empty.');
      return (
        <div className="p-4 prose dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
        </div>
      );
    }

    // iframe embed
    if (tab.contentType === 'iframe') {
      return (
        <div className="p-4">
          <iframe
            src={tab.settings?.url}
            title={tab.label}
            className="w-full h-96 border border-gray-200 dark:border-gray-700 rounded-lg"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      );
    }

    // Query widget (future implementation)
    if (tab.contentType === 'query_widget') {
      return (
        <div className="p-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-yellow-800 dark:text-yellow-200">
              Query widgets are coming soon!
            </p>
          </div>
        </div>
      );
    }

    // Fallback for unknown content types
    return (
      <div className="p-4">
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-gray-600 dark:text-gray-400">
            Content type "{tab.contentType}" is not supported yet.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="relative">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Settings2 className="h-5 w-5 text-blue-500 opacity-50" />
          </div>
        </div>
        <p className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-400">Loading patient tabs...</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">Setting up your workspace</p>
      </div>
    );
  }

  if (resolvedTabs.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">No tabs configured.</p>
        <Button onClick={() => setShowTabManager(true)} className="mt-4">
          <Settings2 className="h-4 w-4 mr-2" />
          Configure Tabs
        </Button>
        <TabManager open={showTabManager} onOpenChange={setShowTabManager} />
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <Tabs defaultValue={defaultTab} className="w-full">
        <div className="relative mb-6">
          {/* Premium Tab List Container */}
          <div className="relative bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-blue-950/30 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-2 shadow-lg backdrop-blur-sm overflow-hidden">
            <TabsList 
              ref={tabsListRef} 
              className="inline-flex w-full h-auto min-h-[60px] items-center justify-start gap-1 bg-transparent p-0 overflow-x-auto overflow-y-hidden scrollbar-thin scroll-smooth"
              style={{ 
                scrollbarWidth: 'thin',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              {resolvedTabs.map((tab) => {
                const IconComponent = SYSTEM_TAB_REGISTRY[tab.key]?.icon || getTabIcon(tab.icon);
                const isReferralsTab = tab.key === 'referrals';

                const handleAddClick = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  // Dispatch custom event to open referral dialog
                  window.dispatchEvent(new CustomEvent('openReferralDialog'));
                };

                return (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    className="flex-shrink-0 flex flex-row items-center justify-center gap-1.5 min-w-[70px] max-w-[90px] text-[11px] font-semibold px-2.5 py-2 rounded-lg transition-all duration-200 ease-out relative group
                      bg-slate-100/50 dark:bg-slate-800/50 
                      text-slate-600 dark:text-slate-400
                      border border-slate-200/60 dark:border-slate-700/60
                      hover:bg-slate-200/70 dark:hover:bg-slate-700/70 
                      hover:border-slate-300 dark:hover:border-slate-600
                      hover:shadow-md hover:scale-[1.02]
                      active:scale-[0.98]
                      data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 
                      data-[state=active]:dark:from-blue-600 data-[state=active]:dark:to-blue-700
                      data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/30
                      data-[state=active]:border-blue-400 dark:data-[state=active]:border-blue-500
                      data-[state=active]:scale-105 data-[state=active]:z-10
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    data-testid={`tab-${tab.key}`}
                    title={tab.label}
                  >
                    {/* Active indicator bar */}
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 data-[state=active]:opacity-100 transition-opacity duration-200" />
                    
                    <IconComponent className="w-3.5 h-3.5 flex-shrink-0 transition-colors duration-200 group-data-[state=active]:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    <span className="truncate leading-tight font-medium">{tab.label}</span>
                    
                    {/* Add button for referrals tab */}
                    {isReferralsTab && (
                      <button
                        onClick={handleAddClick}
                        className="ml-1 p-0.5 rounded hover:bg-white/20 dark:hover:bg-white/10 transition-colors flex-shrink-0"
                        title="Add new referral"
                        data-testid="add-referral-from-tab"
                      >
                        <Plus className="w-3 h-3 transition-colors duration-200 group-data-[state=active]:text-white text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                      </button>
                    )}
                    
                    {/* Active glow effect */}
                    <span className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/20 to-transparent opacity-0 data-[state=active]:opacity-100 pointer-events-none transition-opacity duration-200" />
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Premium Scroll Navigation - Left */}
            {canScrollLeft && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scrollTabs('left')}
                className="absolute left-1 top-1/2 -translate-y-1/2 z-20 bg-white/95 dark:bg-slate-800/95 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md shadow-lg rounded-lg w-7 h-7 p-0 border border-slate-200/60 dark:border-slate-700/60"
                title="Scroll Left"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}

            {/* Premium Scroll Navigation - Right */}
            {canScrollRight && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scrollTabs('right')}
                className="absolute right-12 top-1/2 -translate-y-1/2 z-20 bg-white/95 dark:bg-slate-800/95 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md shadow-lg rounded-lg w-7 h-7 p-0 border border-slate-200/60 dark:border-slate-700/60"
                title="Scroll Right"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}

            {/* Premium Manage Tabs Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTabManager(true)}
              className="absolute top-1.5 right-1.5 z-20 bg-white/95 dark:bg-slate-800/95 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md shadow-md rounded-lg px-2 py-1.5 border border-slate-200/60 dark:border-slate-700/60 group transition-all hover:scale-105"
              title="Manage Tabs"
              data-testid="open-tab-manager"
            >
              <Settings2 className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              {resolvedTabs.length > 8 && (
                <span className="ml-1.5 text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50 px-1.5 py-0.5 rounded">
                  {resolvedTabs.length}
                </span>
              )}
            </Button>

            {/* Premium Scroll Gradient Indicators */}
            {canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white via-slate-50/90 to-transparent dark:from-slate-900 dark:via-slate-800/90 pointer-events-none rounded-l-xl" />
            )}

            {canScrollRight && (
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white via-slate-50/90 to-transparent dark:from-slate-900 dark:via-slate-800/90 pointer-events-none rounded-r-xl" />
            )}
          </div>

          {/* Premium Tab Count Indicator */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {resolvedTabs.length} {resolvedTabs.length === 1 ? 'tab' : 'tabs'} available
            </div>
            {canScrollLeft || canScrollRight ? (
              <div className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <ChevronLeft className="h-3 w-3" />
                <span>Scroll</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            ) : null}
          </div>
        </div>

        {/* Tab Contents */}
        {resolvedTabs.map((tab) => (
          <TabsContent key={tab.key} value={tab.key} className="mt-0">
            {renderTabContent(tab)}
          </TabsContent>
        ))}
      </Tabs>

      {/* Tab Manager Dialog */}
      <TabManager open={showTabManager} onOpenChange={setShowTabManager} />
    </div>
  );
}
