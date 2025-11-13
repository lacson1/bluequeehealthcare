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
        {!tab.isVisible && (
          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
            Hidden
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
            tab.isSystemDefault 
              ? 'System tabs cannot be hidden' 
              : tab.isVisible ? 'Hide tab' : 'Show tab'
          }
          disabled={tab.isSystemDefault}
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
      await apiRequest(`/api/tab-configs/${id}`, 'PATCH', data);
    },
    onMutate: async ({ id, data }) => {
      // Optimistically update local state
      setTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.id === id ? { ...tab, ...data } : tab
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tab-configs'] });
      toast({
        title: 'Success',
        description: 'Tab updated successfully',
      });
    },
    onError: (error: any) => {
      // Rollback on error
      queryClient.invalidateQueries({ queryKey: ['/api/tab-configs'] });
      
      const errorMessage = error?.message || error?.error || 'Failed to update tab';
      toast({
        title: 'Update failed',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Create tab mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('/api/tab-configs', 'POST', data);
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
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create tab',
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
    if (tab.isSystemDefault) {
      toast({
        title: 'Cannot modify system tab',
        description: 'System default tabs cannot be hidden. You can only customize their visibility in organization or user-specific configurations.',
        variant: 'destructive',
      });
      return;
    }
    
    updateMutation.mutate({
      id: tab.id,
      data: { isVisible: !tab.isVisible },
    });
  }

  function handleEdit(tab: TabConfig) {
    setEditingTab(tab);
  }

  function handleSaveEdit() {
    if (editingTab) {
      updateMutation.mutate({
        id: editingTab.id,
        data: {
          label: editingTab.label,
          icon: editingTab.icon,
        },
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

    const key = newTabLabel.toLowerCase().replace(/\s+/g, '-');
    createMutation.mutate({
      scope: 'user',
      key,
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
