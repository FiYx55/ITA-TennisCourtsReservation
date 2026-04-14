"use client";

import { useCreateReservation } from "../hooks/use-reservations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { CalendarIcon, ClockIcon, MapPinIcon, Loader2Icon } from "lucide-react";

interface TimeSlot {
  startTime: string;
  available: boolean;
}

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courtId: string;
  courtName: string;
  slot: TimeSlot;
  hourlyRate: number;
  userId: string;
  onBooked: () => void;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getEndTime(startTime: string): string {
  const end = new Date(startTime);
  end.setHours(end.getHours() + 1);
  return end.toISOString();
}

export function BookingDialog({
  open,
  onOpenChange,
  courtId,
  courtName,
  slot,
  hourlyRate,
  userId,
  onBooked,
}: BookingDialogProps) {
  const { create, isLoading } = useCreateReservation();

  const endTime = getEndTime(slot.startTime);
  const totalPrice = hourlyRate.toFixed(2);

  async function handleConfirm() {
    try {
      await create({
        userId,
        courtId,
        startTime: slot.startTime,
        totalPrice,
      });
      toast.success("Reservation confirmed!", {
        description: `${courtName} booked for ${formatDate(slot.startTime)}.`,
      });
      onOpenChange(false);
      onBooked();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create reservation.";
      toast.error("Booking failed", { description: message });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Booking</DialogTitle>
          <DialogDescription>
            Review the details below and confirm your reservation.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm">
            <MapPinIcon className="size-4 text-muted-foreground" />
            <span className="font-medium">{courtName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CalendarIcon className="size-4 text-muted-foreground" />
            <span>{formatDate(slot.startTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <ClockIcon className="size-4 text-muted-foreground" />
            <span>
              {formatTime(slot.startTime)} - {formatTime(endTime)}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total price</span>
            <span className="text-base font-semibold">${totalPrice}</span>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading && <Loader2Icon className="size-4 animate-spin" />}
            Confirm Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
