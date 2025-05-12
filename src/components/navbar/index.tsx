'use client'; // Make Navbar a client component

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import { UserSelector } from '../user-selector';
// Removed predefinedUsers import, as initial state is handled above

// Keep server-side imports for potential future use or refactor
// import { signOut } from "@/app/actions";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { createClient } from "@/utils/supabase/server";
import { Lock, User as UserIcon } from "lucide-react"; // Renamed User icon to avoid conflict

// Define props for Navbar
interface NavbarProps {
  selectedUserId: string;
  onUserChange: (userId: string) => void;
}

// Mock user data for client-side rendering
// In a real app, you'd fetch this or use a client-side auth hook
const mockUser = null; // Or { email: 'test@example.com' }

const Navbar = ({ selectedUserId, onUserChange }: NavbarProps) => { // Destructure props
  // Remove local state and handler
  // const [selectedUserId, setSelectedUserId] = useState<string>(...);
  // const handleUserChange = (userId: string) => { ... };

  const user = mockUser;
  // const supabase = createClient(); // Cannot use server client here
  // const {
  //   data: { user },
  // } = await supabase.auth.getUser(); // Cannot use await here

  return (
    <header className="w-full border-b">
      <div className="container p-4 sm:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Lock />
          <h5 className="mt-0.5 font-semibold text-lg">AI Content Gen</h5>
        </Link>

        <div className="flex items-center gap-4"> {/* Increased gap */} 
          {/* User Selector */} 
          <UserSelector 
            selectedUserId={selectedUserId} 
            onUserChange={onUserChange} 
          />

          {/* Existing Auth Buttons/Mode Toggle */} 
          {/* Commenting out auth part for now as it needs client-side handling */} 
          {/* {user ? ( ... ) : ( ... ) } */} 
          <ModeToggle />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
