import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Stethoscope, FlaskRound, Pill, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  roles: string[];
}

interface FloatingActionMenuProps {
  onRecordVisit: () => void;
  onAddLabResult: () => void;
  onAddPrescription: () => void;
  onCreateConsultation: () => void;
  userRole: string;
}

export function FloatingActionMenu({
  onRecordVisit,
  onAddLabResult,
  onAddPrescription,
  onCreateConsultation,
  userRole
}: FloatingActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions: FloatingAction[] = [
    {
      id: 'visit',
      label: 'Record Visit',
      icon: <Stethoscope className="w-4 h-4" />,
      onClick: onRecordVisit,
      roles: ['doctor', 'nurse', 'admin']
    },
    {
      id: 'lab',
      label: 'Add Lab Result',
      icon: <FlaskRound className="w-4 h-4" />,
      onClick: onAddLabResult,
      roles: ['doctor', 'nurse', 'admin']
    },
    {
      id: 'prescription',
      label: 'New Prescription',
      icon: <Pill className="w-4 h-4" />,
      onClick: onAddPrescription,
      roles: ['doctor', 'admin']
    },
    {
      id: 'consultation',
      label: 'Create Consultation',
      icon: <FileText className="w-4 h-4" />,
      onClick: onCreateConsultation,
      roles: ['doctor', 'nurse', 'admin']
    }
  ];

  const availableActions = actions.filter(action => 
    action.roles.includes(userRole)
  );

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-16 right-0 space-y-2"
          >
            {availableActions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  className="flex items-center space-x-2 shadow-lg hover:shadow-xl transition-shadow"
                  size="sm"
                >
                  {action.icon}
                  <span className="whitespace-nowrap">{action.label}</span>
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
        size="lg"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </motion.div>
      </Button>
    </div>
  );
}