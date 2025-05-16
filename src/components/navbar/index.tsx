'use client'; // Make Navbar a client component

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import { UserSelector } from '../user-selector';
import { useAuth } from "@/contexts/AuthContext";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Lock, User as UserIcon, LogOut } from "lucide-react";

// Define props for Navbar
interface NavbarProps {
  selectedUserId: string;
  onUserChange: (userId: string) => void;
}

const Navbar = ({ selectedUserId, onUserChange }: NavbarProps) => {
  const { user, signOut, isLoading } = useAuth();

  return (
    <header className="w-full border-b">
      <div className="container p-4 sm:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Lock />
          <h5 className="mt-0.5 font-semibold text-lg">AI Content Gen</h5>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* User dropdown menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <UserIcon className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {user.email || "User"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {/* If user is not authenticated, show login/register buttons */}
              {!isLoading && (
                <>
                  <Button variant="outline" asChild>
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register">Sign up</Link>
                  </Button>
                </>
              )}
            </>
          )}

          <ModeToggle />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
