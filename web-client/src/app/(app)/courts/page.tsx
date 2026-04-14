"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { CourtList } from "@/modules/courts/components/court-list";
import { CourtDetail } from "@/modules/courts/components/court-detail";
import { BookingDialog } from "@/modules/reservations/components/booking-dialog";
import type { Court } from "@/modules/courts/types";
import type { Slot } from "@/modules/courts/types";

export default function CourtsPage() {
  const { user } = useAuth();
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [bookingKey, setBookingKey] = useState(0);

  function handleSlotSelect(slot: Slot) {
    setSelectedSlot(slot);
  }

  function handleBooked() {
    setSelectedSlot(null);
    setBookingKey((k) => k + 1);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tennis Courts</h1>

      {selectedCourt ? (
        <div className="space-y-4">
          <button
            onClick={() => { setSelectedCourt(null); setSelectedSlot(null); }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to all courts
          </button>
          <CourtDetail
            key={bookingKey}
            courtId={selectedCourt.id}
            onSlotSelect={handleSlotSelect}
          />

          {selectedSlot && user && (
            <BookingDialog
              open={!!selectedSlot}
              onOpenChange={(open) => { if (!open) setSelectedSlot(null); }}
              courtId={selectedCourt.id}
              courtName={selectedCourt.name}
              slot={selectedSlot}
              hourlyRate={selectedCourt.hourly_rate}
              userId={user.id}
              onBooked={handleBooked}
            />
          )}
        </div>
      ) : (
        <CourtList onSelect={setSelectedCourt} />
      )}
    </div>
  );
}
