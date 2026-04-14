"use client";

import { useState } from "react";
import {
  useUserReservations,
  useCancelReservation,
} from "../hooks/use-reservations";
import type { Reservation } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { CalendarIcon, ClockIcon, Loader2Icon } from "lucide-react";

interface ReservationListProps {
  userId: string;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

function formatPrice(price: string): string {
  return `$${parseFloat(price).toFixed(2)}`;
}

type StatusVariant = "default" | "secondary" | "destructive" | "outline";

function statusVariant(status: string): StatusVariant {
  switch (status.toLowerCase()) {
    case "confirmed":
      return "default";
    case "cancelled":
      return "destructive";
    case "completed":
      return "secondary";
    default:
      return "outline";
  }
}

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export function ReservationList({ userId }: ReservationListProps) {
  const { reservations, isLoading, error, refetch } =
    useUserReservations(userId);
  const { cancel, isLoading: isCancelling } = useCancelReservation();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  async function handleCancel(reservation: Reservation) {
    setCancellingId(reservation.id);
    try {
      await cancel(reservation.id);
      toast.success("Reservation cancelled successfully.");
      await refetch();
    } catch {
      toast.error("Failed to cancel reservation. Please try again.");
    } finally {
      setCancellingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <CalendarIcon className="size-10 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">
          No reservations yet
        </p>
        <p className="text-xs text-muted-foreground">
          Your reservations will appear here once you book a court.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop: table layout */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Court</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.map((reservation) => (
              <TableRow key={reservation.id}>
                <TableCell className="font-medium">
                  {reservation.courtName ?? `Court ${reservation.courtId}`}
                </TableCell>
                <TableCell>{formatDate(reservation.startTime)}</TableCell>
                <TableCell>
                  {formatTimeRange(reservation.startTime, reservation.endTime)}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(reservation.status)}>
                    {statusLabel(reservation.status)}
                  </Badge>
                </TableCell>
                <TableCell>{formatPrice(reservation.totalPrice)}</TableCell>
                <TableCell className="text-right">
                  {reservation.status.toLowerCase() === "confirmed" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isCancelling && cancellingId === reservation.id}
                      onClick={() => handleCancel(reservation)}
                    >
                      {isCancelling && cancellingId === reservation.id && (
                        <Loader2Icon className="size-3.5 animate-spin" />
                      )}
                      Cancel
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: card layout */}
      <div className="flex flex-col gap-3 md:hidden">
        {reservations.map((reservation) => (
          <Card key={reservation.id} size="sm">
            <CardHeader>
              <CardTitle>
                {reservation.courtName ?? `Court ${reservation.courtId}`}
              </CardTitle>
              <CardAction>
                <Badge variant={statusVariant(reservation.status)}>
                  {statusLabel(reservation.status)}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="size-3.5" />
                <span>{formatDate(reservation.startTime)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ClockIcon className="size-3.5" />
                <span>
                  {formatTimeRange(reservation.startTime, reservation.endTime)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {formatPrice(reservation.totalPrice)}
                </span>
                {reservation.status.toLowerCase() === "confirmed" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isCancelling && cancellingId === reservation.id}
                    onClick={() => handleCancel(reservation)}
                  >
                    {isCancelling && cancellingId === reservation.id && (
                      <Loader2Icon className="size-3.5 animate-spin" />
                    )}
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
