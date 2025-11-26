import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface PanditServicesModalProps {
  panditId: number;
  panditName: string;
}

export const PanditServicesModal: React.FC<PanditServicesModalProps> = ({
  panditId,
  panditName,
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full">View Services</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Services by {panditName}</DialogTitle>
          <DialogDescription>
            Select a service to book with this pandit.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Services will be loaded here. (Feature coming soon)
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

