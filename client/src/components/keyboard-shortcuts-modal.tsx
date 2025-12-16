import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Keyboard, Search, Navigation, FileText, Zap } from 'lucide-react';

interface ShortcutGroup {
  title: string;
  icon: React.ReactNode;
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '?' && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        // Only open if not in an input field
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          event.preventDefault();
          setOpen(true);
        }
      }
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const shortcutGroups: ShortcutGroup[] = [
    {
      title: 'Navigation',
      icon: <Navigation className="h-4 w-4" />,
      shortcuts: [
        { keys: ['Alt', '1'], description: 'Go to Dashboard' },
        { keys: ['Alt', '2'], description: 'Go to Patients' },
        { keys: ['Alt', '3'], description: 'Go to Appointments' },
        { keys: ['Alt', '4'], description: 'Go to Lab Results' },
        { keys: ['Alt', '5'], description: 'Go to Pharmacy' },
        { keys: ['Alt', '6'], description: 'Go to Billing' },
        { keys: ['Alt', '7'], description: 'Go to Inventory' },
        { keys: ['Alt', '8'], description: 'Go to Reports' },
        { keys: ['Alt', '9'], description: 'Go to Settings' },
      ],
    },
    {
      title: 'Quick Actions',
      icon: <Zap className="h-4 w-4" />,
      shortcuts: [
        { keys: ['Ctrl', 'N'], description: 'New Consultation' },
        { keys: ['Ctrl', 'Shift', 'N'], description: 'New Patient Registration' },
        { keys: ['Ctrl', 'Shift', 'P'], description: 'New Prescription' },
        { keys: ['Ctrl', 'Shift', 'L'], description: 'New Lab Order' },
        { keys: ['Ctrl', 'Shift', 'M'], description: 'Open Messages' },
        { keys: ['Ctrl', 'S'], description: 'Save Current Form' },
        { keys: ['Ctrl', 'P'], description: 'Print Current Page' },
      ],
    },
    {
      title: 'Search & Find',
      icon: <Search className="h-4 w-4" />,
      shortcuts: [
        { keys: ['Ctrl', 'K'], description: 'Quick Patient Search' },
        { keys: ['Ctrl', 'F'], description: 'Find in Page' },
        { keys: ['/'], description: 'Focus Search Box' },
      ],
    },
    {
      title: 'Forms & Documents',
      icon: <FileText className="h-4 w-4" />,
      shortcuts: [
        { keys: ['Tab'], description: 'Next Field' },
        { keys: ['Shift', 'Tab'], description: 'Previous Field' },
        { keys: ['Ctrl', 'Enter'], description: 'Submit Form' },
        { keys: ['Esc'], description: 'Close Modal/Cancel' },
        { keys: ['Ctrl', 'Z'], description: 'Undo' },
        { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
      ],
    },
    {
      title: 'General',
      icon: <Keyboard className="h-4 w-4" />,
      shortcuts: [
        { keys: ['?'], description: 'Show Keyboard Shortcuts' },
        { keys: ['Esc'], description: 'Close Dialog' },
        { keys: ['Ctrl', ','], description: 'Open Settings' },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-blue-600" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate and work faster in Bluequee Health Management
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {shortcutGroups.map((group, idx) => (
              <div key={idx} className="space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2 text-slate-700">
                  {group.icon}
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, shortcutIdx) => (
                    <div
                      key={shortcutIdx}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-sm text-slate-600">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIdx) => (
                          <div key={keyIdx} className="flex items-center gap-1">
                            <Badge
                              variant="outline"
                              className="font-mono text-xs px-2 py-1 bg-white"
                            >
                              {key}
                            </Badge>
                            {keyIdx < shortcut.keys.length - 1 && (
                              <span className="text-slate-400">+</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-center pt-4 border-t">
          <p className="text-xs text-slate-500">
            Press <Badge variant="outline" className="mx-1 font-mono">?</Badge> anytime to show this guide
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
