"use client";

import { useState } from "react";
import { useCourts } from "../hooks/use-courts";
import { useAvailableSlots } from "@/modules/reservations/hooks/use-reservations";
import type { Court, Slot } from "../types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useEffect } from "react";

const SURFACE_LABELS: Record<string, string> = {
  clay: "Clay",
  grass: "Grass",
  hard: "Hard",
};

interface CourtDetailProps {
  courtId: string;
  onSlotSelect: (slot: Slot) => void;
}

function todayString() {
  return new Date().toISOString().split("T")[0];
}

function formatTime(isoOrTime: string): string {
  const date = new Date(isoOrTime);
  if (!isNaN(date.getTime())) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return isoOrTime;
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <Card>
        <CardHeader>
          <div className="h-6 w-1/2 rounded bg-muted" />
          <div className="h-4 w-1/3 rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="h-4 w-1/2 rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-7">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="h-10 rounded-md bg-muted" />
        ))}
      </div>
    </div>
  );
}

export function CourtDetail({ courtId, onSlotSelect }: CourtDetailProps) {
  const [court, setCourt] = useState<Court | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayString());

  const { slots, isLoading: slotsLoading } = useAvailableSlots(courtId, selectedDate);

  useEffect(() => {
    async function fetchCourt() {
      setIsLoading(true);
      try {
        const data = await api.get<Court>(`/courts/${courtId}`);
        setCourt(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch court");
      } finally {
        setIsLoading(false);
      }
    }
    fetchCourt();
  }, [courtId]);

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (isLoading || !court) {
    return <DetailSkeleton />;
  }

  const dateLabel = new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{court.name}</CardTitle>
          <CardDescription>
            {court.is_indoor ? "Indoor" : "Outdoor"} &middot;{" "}
            {SURFACE_LABELS[court.surface] ?? court.surface}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">
              {SURFACE_LABELS[court.surface] ?? court.surface}
            </Badge>
            <Badge variant="outline">
              €{court.hourly_rate.toFixed(2)}/hr
            </Badge>
            {!court.is_active && (
              <Badge variant="destructive">Inactive</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date-picker">Select Date</Label>
            <Input
              id="date-picker"
              type="date"
              value={selectedDate}
              min={todayString()}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>
          <p className="text-sm text-muted-foreground">{dateLabel}</p>
        </div>

        <h3 className="text-base font-semibold">Available Slots</h3>

        {slotsLoading ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-7">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No time slots available for this date.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-7">
            {slots.map((slot) => {
              const label = formatTime(slot.startTime);

              if (slot.available) {
                return (
                  <button
                    key={slot.startTime}
                    type="button"
                    onClick={() => onSlotSelect(slot)}
                    className="rounded-md border border-primary/30 bg-primary/10 px-2 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {label}
                  </button>
                );
              }

              return (
                <button
                  key={slot.startTime}
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-md border border-destructive/30 bg-destructive/10 px-2 py-2 text-sm font-medium text-destructive opacity-60"
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
