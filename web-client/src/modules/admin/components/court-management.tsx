"use client";

import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { useAdminCourts } from "../hooks/use-admin";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SURFACE_OPTIONS = [
  { value: "clay", label: "Clay" },
  { value: "grass", label: "Grass" },
  { value: "hard", label: "Hard" },
] as const;

const SURFACE_LABELS: Record<string, string> = {
  clay: "Clay",
  grass: "Grass",
  hard: "Hard",
};

export function CourtManagement() {
  const { courts, isLoading, createCourt, deleteCourt } = useAdminCourts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [surface, setSurface] = useState<string>("clay");
  const [isIndoor, setIsIndoor] = useState(false);
  const [hourlyRate, setHourlyRate] = useState("");

  function resetForm() {
    setName("");
    setSurface("clay");
    setIsIndoor(false);
    setHourlyRate("");
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createCourt({
        name,
        surface: surface as "clay" | "grass" | "hard",
        is_indoor: isIndoor,
        hourly_rate: parseFloat(hourlyRate),
      });
      toast.success("Court created successfully");
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create court";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCourt(id);
      toast.success("Court deleted successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete court";
      toast.error(message);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-full rounded bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Courts</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>Add Court</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Court</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new court.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="court-name">Name</Label>
                <Input
                  id="court-name"
                  required
                  placeholder="Court name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="court-surface">Surface</Label>
                <Select value={surface} onValueChange={(v) => { if (v) setSurface(v); }}>
                  <SelectTrigger id="court-surface" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SURFACE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="court-indoor"
                  type="checkbox"
                  checked={isIndoor}
                  onChange={(e) => setIsIndoor(e.target.checked)}
                  className="size-4 rounded border border-input accent-primary"
                />
                <Label htmlFor="court-indoor">Indoor court</Label>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="court-rate">Hourly Rate</Label>
                <Input
                  id="court-rate"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Court"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {courts.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No courts found. Add one to get started.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Surface</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courts.map((court) => (
              <TableRow key={court.id}>
                <TableCell className="font-medium">{court.name}</TableCell>
                <TableCell>
                  {SURFACE_LABELS[court.surface] ?? court.surface}
                </TableCell>
                <TableCell>{court.is_indoor ? "Indoor" : "Outdoor"}</TableCell>
                <TableCell>${court.hourly_rate.toFixed(2)}/hr</TableCell>
                <TableCell>
                  <Badge variant={court.is_active ? "default" : "secondary"}>
                    {court.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(court.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
