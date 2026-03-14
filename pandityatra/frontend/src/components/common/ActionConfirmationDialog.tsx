import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import logo from '@/assets/images/PanditYatralogo.png';
import { AlertTriangle } from 'lucide-react';

interface ActionConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

export const ActionConfirmationDialog: React.FC<ActionConfirmationDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel = 'Yes, Continue',
  cancelLabel = 'Cancel',
  isLoading = false,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden">
        <div className="flex flex-col items-center p-6 pb-4">
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center p-3">
              <img
                src={logo}
                alt="PanditYatra Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
          </div>

          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold text-center text-gray-900">
              {title}
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600 text-base">
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter className="flex flex-row gap-3 p-6 pt-0 sm:justify-center">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1 h-12 text-base font-semibold border-2 hover:bg-gray-50"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={() => {
              onConfirm();
            }}
            disabled={isLoading}
            className="flex-1 h-12 text-base font-semibold bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isLoading ? 'Please wait...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
