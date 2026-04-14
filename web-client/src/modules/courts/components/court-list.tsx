"use client";

import { useCourts } from "../hooks/use-courts";
import type { Court } from "../types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SURFACE_LABELS: Record<Court["surface"], string> = {
  clay: "Clay",
  grass: "Grass",
  hard: "Hard",
};

const SURFACE_VARIANTS: Record<
  Court["surface"],
  "default" | "secondary" | "outline"
> = {
  clay: "default",
  grass: "secondary",
  hard: "outline",
};

interface CourtListProps {
  onSelect: (court: Court) => void;
}

function CourtCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-5 w-2/3 rounded bg-muted" />
        <div className="h-4 w-1/3 rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="h-4 w-1/2 rounded bg-muted" />
          <div className="h-4 w-1/4 rounded bg-muted" />
        </div>
      </CardContent>
      <CardFooter>
        <div className="h-5 w-16 rounded bg-muted" />
      </CardFooter>
    </Card>
  );
}

export function CourtList({ onSelect }: CourtListProps) {
  const { courts, isLoading, error } = useCourts();

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CourtCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (courts.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No courts available.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {courts.map((court) => (
        <button
          key={court.id}
          type="button"
          className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
          onClick={() => onSelect(court)}
        >
          <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle>{court.name}</CardTitle>
              <CardDescription>
                {court.is_indoor ? "Indoor" : "Outdoor"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant={SURFACE_VARIANTS[court.surface]}>
                  {SURFACE_LABELS[court.surface]}
                </Badge>
                {!court.is_active && (
                  <Badge variant="destructive">Inactive</Badge>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <span className="text-sm font-semibold">
                ${court.hourly_rate.toFixed(2)}/hr
              </span>
            </CardFooter>
          </Card>
        </button>
      ))}
    </div>
  );
}
