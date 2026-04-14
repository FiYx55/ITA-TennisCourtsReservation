"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, isAdmin } from "@/lib/auth-context";
import { useUnreadCount } from "@/modules/notifications/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/courts", label: "Courts" },
  { href: "/reservations", label: "My Reservations" },
  { href: "/notifications", label: "Notifications" },
  { href: "/admin", label: "Admin", adminOnly: true },
];

function NavLinks({ onClick, showAdmin }: { onClick?: () => void; showAdmin: boolean }) {
  const pathname = usePathname();

  const items = showAdmin ? NAV_ITEMS : NAV_ITEMS.filter((i) => !i.adminOnly);

  return (
    <>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClick}
          className={`text-sm font-medium transition-colors hover:text-primary ${
            pathname.startsWith(item.href)
              ? "text-primary"
              : "text-muted-foreground"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </>
  );
}

export function NavBar() {
  const { user, logout } = useAuth();
  const { count: unreadCount } = useUnreadCount(user?.id);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link href="/courts" className="mr-6 font-bold text-lg text-primary">
          🎾 TennisCourts
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 flex-1">
          <NavLinks showAdmin={isAdmin(user)} />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="-ml-4">
              {unreadCount}
            </Badge>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {user.firstName} {user.lastName}
          </span>
          <Button variant="outline" size="sm" onClick={logout}>
            Logout
          </Button>
        </div>

        {/* Mobile nav */}
        <div className="flex md:hidden flex-1 justify-end">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
              Menu
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {unreadCount}
                </Badge>
              )}
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="flex flex-col gap-4 mt-8">
                <NavLinks onClick={() => setMobileOpen(false)} showAdmin={isAdmin(user)} />
                <Separator />
                <span className="text-sm text-muted-foreground">
                  {user.firstName} {user.lastName}
                </span>
                <Button variant="outline" size="sm" onClick={logout}>
                  Logout
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
