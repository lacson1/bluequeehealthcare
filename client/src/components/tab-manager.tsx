import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Settings2,
  LayoutGrid,
  Calendar,
  TestTube,
  Pill,
  Activity,
  FileText,
  CreditCard,
  Shield,
  CalendarDays,
  History,
  FileCheck,
  MessageSquare,
  Heart,
  Baby,
  Brain,
  Bone,
  Scissors,
  AlertCircle,
  Stethoscope,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

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
  isMandatory?: boolean;
  category?: string;
}

interface TabPreset {
  id: number;
  name: string;
  description: string;
  scope: string;
  icon: string;
  isDefault: boolean;
}

interface TabManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const iconMap: Record<string, any> = {
  LayoutGrid,
  Calendar,
  TestTube,
  Pill,
  Activity,
  FileText,
  CreditCard,
  Shield,
  CalendarDays,
  History,
  FileCheck,
  MessageSquare,
  Settings2,
  Plus,
  Heart,
  Baby,
  Brain,
  Bone,
  Scissors,
  AlertCircle,
  Stethoscope,
  Sparkles,
};

// Specialty preset icons mapping
const specialtyIconMap: Record<string, any> = {
  'Cardiology': Heart,
  'Pediatrics': Baby,
  'Psychiatry': Brain,
  'Orthopedics': Bone,
  'Dermatology': Scissors,
  'Oncology': Activity,
  'Emergency Medicine': AlertCircle,
  'General Practice': Stethoscope,
};

interface SortableTabItemProps {
  tab: TabConfig;
  onEdit: (tab: TabConfig) => void;
  onDelete: (tab: TabConfig) => void;
  onToggleVisibility: (tab: TabConfig) => void;
}

function SortableTabItem({ tab, onEdit, onDelete, onToggleVisibility }: SortableTabItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id, disabled: tab.isSystemDefault });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const IconComponent = iconMap[tab.icon] || Settings2;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${
        isDragging ? 'shadow-lg z-50' : ''
      }`}
      data-testid={`tab-item-${tab.key}`}
    >
      <div
        {...attributes}
        {...listeners}
        className={tab.isSystemDefault ? "opacity-30 cursor-not-allowed text-gray-300" : "cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}
        data-testid={`drag-handle-${tab.key}`}
        title={tab.isSystemDefault ? "System tabs cannot be reordered" : "Drag to reorder"}
      >
        <GripVertical className="h-5 w-5" />
      </div>

      <div className="flex items-center gap-2 flex-1">
        <IconComponent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <span className="font-medium text-gray-900 dark:text-gray-100">{tab.label}</span>
        {tab.isSystemDefault && (
          <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
            System
          </span>
        )}
        {tab.isMandatory && (
          <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full">
            Mandatory
          </span>
        )}
        {!tab.isVisible && (
          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
            Hidden
          </span>
        )}
        {tab.category && (
          <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full">
            {tab.category}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleVisibility(tab)}
          data-testid={`toggle-visibility-${tab.key}`}
          title={
            tab.isMandatory
              ? 'Mandatory tabs cannot be hidden' 
              : tab.isVisible ? 'Hide tab' : 'Show tab'
          }
          disabled={tab.isMandatory}
          className={tab.isSystemDefault ? 'opacity-50 cursor-not-allowed' : ''}
        >
          {tab.isVisible ? (
            <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <EyeOff className="h-4 w-4 text-gray-400" />
          )}
        </Button>

        {!tab.isSystemDefault && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(tab)}
              data-testid={`edit-tab-${tab.key}`}
              title="Edit tab"
            >
              <Pencil className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(tab)}
              data-testid={`delete-tab-${tab.key}`}
              title="Delete tab"
            >
              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function TabManager({ open, onOpenChange }: TabManagerProps) {
  const [tabs, setTabs] = useState<TabConfig[]>([]);
  const [editingTab, setEditingTab] = useState<TabConfig | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<TabPreset | null>(null);
  const [newTabLabel, setNewTabLabel] = useState('');
  const [newTabIcon, setNewTabIcon] = useState('Settings2');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch tab configurations
  const { data: fetchedTabs, isLoading } = useQuery<TabConfig[]>({
    queryKey: ['/api/tab-configs'],
    enabled: open,
  });

  // Fetch presets
  const { data: presets } = useQuery<TabPreset[]>({
    queryKey: ['/api/tab-presets'],
    enabled: open,
  });

  // Update tabs when data changes
  useEffect(() => {
    if (fetchedTabs) {
      setTabs(fetchedTabs);
    }
  }, [fetchedTabs]);

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (reorderedTabs: TabConfig[]) => {
      const updates = reorderedTabs.map((tab, index) => ({
        id: tab.id,
        displayOrder: (index + 1) * 10,
      }));
      await apiRequest('/api/tab-configs/reorder', 'PATCH', { tabs: updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tab-configs'] });
      toast({
        title: 'Success',
        description: 'Tab order updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update tab order',
        variant: 'destructive',
      });
    },
  });

  // Update tab mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TabConfig> }) => {
      const response = await apiRequest(`/api/tab-configs/${id}`, 'PATCH', data);
      return response;
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['/api/tab-configs'] });
      
      // Snapshot the previous value
      const previousTabs = queryClient.getQueryData<TabConfig[]>(['/api/tab-configs']);
      
      // Optimistically update both local state and query cache
      setTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.id === id ? { ...tab, ...data, updatedAt: new Date() } : tab
        )
      );
      
      queryClient.setQueryData<TabConfig[]>(['/api/tab-configs'], (old) =>
        old ? old.map(tab => 
          tab.id === id ? { ...tab, ...data, updatedAt: new Date() } : tab
        ) : []
      );
      
      // Return context with previous value
      return { previousTabs };
    },
    onSuccess: (data, variables) => {
      // Refetch to ensure we have server state
      queryClient.invalidateQueries({ queryKey: ['/api/tab-configs'] });
      toast({
        title: 'Success',
        description: 'Tab updated successfully',
      });
    },
    onError: (error: any, variables, context) => {
      // Rollback to previous state on error
      if (context?.previousTabs) {
        queryClient.setQueryData(['/api/tab-configs'], context.previousTabs);
        setTabs(context.previousTabs);
      }
      
      const errorMessage = error?.message || error?.error || 'Failed to update tab';
      toast({
        title: 'Update failed',
        description: errorMessage,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure sync
      queryClient.invalidateQueries({ queryKey: ['/api/tab-configs'] });
    },
  });

  // Create tab mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Creating tab with data:', data);
      const response = await apiRequest('/api/tab-configs', 'POST', data);
      const result = await response.json();
      console.log('Tab creation result:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tab-configs'] });
      setShowAddDialog(false);
      setNewTabLabel('');
      setNewTabIcon('Settings2');
      toast({
        title: 'Success',
        description: 'Tab created successfully',
      });
    },
    onError: async (error: any) => {
      console.error('Tab creation error:', error);
      
      let errorMessage = 'Failed to create tab';
      
      try {
        // Try to parse error response
        if (error?.message) {
          const errorText = error.message;
          // Extract JSON from error message if present
          const jsonMatch = errorText.match(/\{.*\}/);
          if (jsonMatch) {
            const errorData = JSON.parse(jsonMatch[0]);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            errorMessage = errorText;
          }
        }
      } catch (e) {
        console.error('Failed to parse error:', e);
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Delete tab mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/tab-configs/${id}`, 'DELETE');
    },
    onMutate: async (id: number) => {
      // Optimistically remove the tab from local state immediately
      setTabs(prevTabs => prevTabs.filter(tab => tab.id !== id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tab-configs'] });
      toast({
        title: 'Success',
        description: 'Tab deleted successfully',
      });
    },
    onError: (error, id) => {
      // Rollback: refetch tabs to restore the deleted one
      queryClient.invalidateQueries({ queryKey: ['/api/tab-configs'] });
      toast({
        title: 'Error',
        description: 'Failed to delete tab',
        variant: 'destructive',
      });
    },
  });

  // Apply preset mutation
  const applyPresetMutation = useMutation({
    mutationFn: async ({ presetId, targetScope }: { presetId: number; targetScope: string }) => {
      await apiRequest(`/api/tab-presets/${presetId}/apply`, 'POST', { targetScope });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tab-configs'] });
      setShowPresetDialog(false);
      setSelectedPreset(null);
      toast({
        title: 'Success',
        description: 'Preset applied successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.error || 'Failed to apply preset',
        variant: 'destructive',
      });
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tabs.findIndex((tab) => tab.id === active.id);
      const newIndex = tabs.findIndex((tab) => tab.id === over.id);

      const reordered = arrayMove(tabs, oldIndex, newIndex);
      setTabs(reordered);
      
      // Only send custom tabs for reordering (filter out system defaults)
      const customTabsOnly = reordered.filter(tab => !tab.isSystemDefault);
      
      if (customTabsOnly.length === 0) {
        toast({
          title: 'Info',
          description: 'Only custom tabs can be reordered. System tabs maintain their default order.',
        });
        return;
      }
      
      reorderMutation.mutate(customTabsOnly);
    }
  }

  function handleToggleVisibility(tab: TabConfig) {
    if (tab.isMandatory) {
      toast({
        title: 'Cannot hide mandatory tab',
        description: 'This tab is required and cannot be hidden.',
        variant: 'destructive',
      });
      return;
    }
    
    // Use new visibility endpoint
    const newVisibility = !tab.isVisible;
    apiRequest(`/api/tab-configs/${tab.id}/visibility`, 'PATCH', { isVisible: newVisibility })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/tab-configs'] });
        toast({
          title: 'Success',
          description: newVisibility ? 'Tab shown successfully' : 'Tab hidden successfully',
        });
      })
      .catch((error: any) => {
        toast({
          title: 'Error',
          description: error?.error || 'Failed to update tab visibility',
          variant: 'destructive',
        });
      });
  }

  function handleEdit(tab: TabConfig) {
    setEditingTab(tab);
  }

  function handleSaveEdit() {
    if (editingTab) {
      const updateData = {
        label: editingTab.label,
        icon: editingTab.icon,
        isVisible: editingTab.isVisible,
        settings: editingTab.settings,
      };
      
      updateMutation.mutate({
        id: editingTab.id,
        data: updateData,
      });
      setEditingTab(null);
    }
  }

  function handleDelete(tab: TabConfig) {
    if (confirm(`Are you sure you want to delete the "${tab.label}" tab?`)) {
      deleteMutation.mutate(tab.id);
    }
  }

  function handleAddTab() {
    if (!newTabLabel.trim()) {
      toast({
        title: 'Error',
        description: 'Tab label is required',
        variant: 'destructive',
      });
      return;
    }

    // Generate a unique key by combining label with timestamp to ensure uniqueness
    // This allows multiple tabs with similar names without conflicts
    const baseKey = newTabLabel.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const uniqueKey = `${baseKey}-${Date.now()}`;
    
    createMutation.mutate({
      scope: 'user',
      key: uniqueKey,
      label: newTabLabel,
      icon: newTabIcon,
      contentType: 'markdown',
      settings: { markdown: '# Custom Tab\n\nAdd your content here.' },
      isVisible: true,
      displayOrder: (tabs.length + 1) * 10,
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="tab-manager-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Manage Tabs
            </DialogTitle>
            <DialogDescription>
              Customize your patient overview tabs. Drag to reorder, toggle visibility, or create custom tabs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading tabs...</div>
            ) : tabs.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">No tabs configured</div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={tabs.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {tabs.map((tab) => (
                      <SortableTabItem
                        key={tab.id}
                        tab={tab}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleVisibility={handleToggleVisibility}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowPresetDialog(true)} data-testid="apply-preset-button">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Apply Preset
            </Button>
            <Button variant="outline" onClick={() => setShowAddDialog(true)} data-testid="add-tab-button">
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Tab
            </Button>
            <Button onClick={() => onOpenChange(false)} data-testid="close-tab-manager">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tab Dialog */}
      <Dialog open={!!editingTab} onOpenChange={(open) => !open && setEditingTab(null)}>
        <DialogContent data-testid="edit-tab-dialog">
          <DialogHeader>
            <DialogTitle>Edit Tab</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-label">Tab Label</Label>
              <Input
                id="edit-label"
                value={editingTab?.label || ''}
                onChange={(e) =>
                  setEditingTab((prev) => (prev ? { ...prev, label: e.target.value } : null))
                }
                data-testid="edit-tab-label-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-icon">Icon</Label>
              <Select
                value={editingTab?.icon || 'Settings2'}
                onValueChange={(value) =>
                  setEditingTab((prev) => (prev ? { ...prev, icon: value } : null))
                }
              >
                <SelectTrigger id="edit-icon" data-testid="edit-tab-icon-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(iconMap).map((iconName) => (
                    <SelectItem key={iconName} value={iconName}>
                      {iconName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTab(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} data-testid="save-edit-tab">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply Preset Dialog */}
      <Dialog open={showPresetDialog} onOpenChange={setShowPresetDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="preset-dialog">
          <DialogHeader>
            <DialogTitle>Apply Preset Layout</DialogTitle>
            <DialogDescription>Choose a preset tab layout to quickly configure your view. Specialty presets are optimized for specific medical fields.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Specialty Presets Section */}
            {presets && presets.some(p => specialtyIconMap[p.name]) && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-2 py-1">
                  <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Specialty Presets
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {presets
                    .filter(preset => specialtyIconMap[preset.name])
                    .map((preset) => {
                      const IconComponent = specialtyIconMap[preset.name] || Settings2;
                      return (
                        <div
                          key={preset.id}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                            selectedPreset?.id === preset.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-md scale-[1.02]'
                              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm'
                          }`}
                          onClick={() => setSelectedPreset(preset)}
                          data-testid={`preset-option-${preset.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                              selectedPreset?.id === preset.id
                                ? 'bg-blue-100 dark:bg-blue-900'
                                : 'bg-gray-100 dark:bg-gray-800'
                            }`}>
                              <IconComponent className={`h-5 w-5 ${
                                selectedPreset?.id === preset.id
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="font-semibold text-gray-900 dark:text-gray-100">{preset.name}</div>
                                {preset.isDefault && (
                                  <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
                                    Default
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {preset.description}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Other Presets Section */}
            {presets && presets.some(p => !specialtyIconMap[p.name]) && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-2 py-1">
                  <LayoutGrid className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    General Presets
                  </h3>
                </div>
                <div className="space-y-2">
                  {presets
                    .filter(preset => !specialtyIconMap[preset.name])
                    .map((preset) => {
                      const IconComponent = iconMap[preset.icon] || Settings2;
                      return (
                        <div
                          key={preset.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedPreset?.id === preset.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                          }`}
                          onClick={() => setSelectedPreset(preset)}
                          data-testid={`preset-option-${preset.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <IconComponent className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-medium text-gray-900 dark:text-gray-100">{preset.name}</div>
                                {preset.isDefault && (
                                  <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
                                    Default
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{preset.description}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {(!presets || presets.length === 0) && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No presets available
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPresetDialog(false);
              setSelectedPreset(null);
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedPreset) {
                  applyPresetMutation.mutate({ 
                    presetId: selectedPreset.id, 
                    targetScope: 'user' 
                  });
                }
              }}
              disabled={!selectedPreset || applyPresetMutation.isPending}
              data-testid="confirm-apply-preset"
            >
              {applyPresetMutation.isPending ? 'Applying...' : 'Apply Preset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Tab Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent data-testid="add-tab-dialog">
          <DialogHeader>
            <DialogTitle>Add Custom Tab</DialogTitle>
            <DialogDescription>Create a new custom tab for your patient overview.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-label">Tab Label</Label>
              <Input
                id="new-label"
                placeholder="e.g., Notes, Timeline, Custom"
                value={newTabLabel}
                onChange={(e) => setNewTabLabel(e.target.value)}
                data-testid="new-tab-label-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-icon">Icon</Label>
              <Select value={newTabIcon} onValueChange={setNewTabIcon}>
                <SelectTrigger id="new-icon" data-testid="new-tab-icon-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(iconMap).map((iconName) => (
                    <SelectItem key={iconName} value={iconName}>
                      {iconName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTab} disabled={createMutation.isPending} data-testid="create-tab-button">
              {createMutation.isPending ? 'Creating...' : 'Create Tab'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
