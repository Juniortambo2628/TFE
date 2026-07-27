import React, { useState, useEffect } from "react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/Components/ui/command";
import { 
    LayoutDashboard, 
    User, 
    Settings, 
    Bell, 
    Search,
    LogOut,
    Home,
    Shield,
    Users,
    FileText,
    HelpCircle,
    Calendar,
    MapPin,
    CreditCard,
    Wallet,
    Ticket
} from "lucide-react";
import { router } from "@inertiajs/react";

export default function CommandMenu() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const down = (e) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = (command) => {
        command();
        setOpen(false);
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="command-menu-trigger group"
                aria-label="Open Command Menu"
            >
                <Search className="w-6 h-6" />
                <span className="command-menu-tooltip">
                    Command Menu <kbd className="ml-1 px-1 bg-white/10 rounded border border-white/10 text-[10px]">⌘K</kbd>
                </span>
            </button>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Type a command or search..." className="text-white placeholder:text-gray-500 border-none focus:ring-0" />
                <CommandList className="max-h-[450px] custom-scrollbar pb-2">
                    <CommandEmpty className="py-6 text-center text-sm text-gray-400">No results found.</CommandEmpty>
                        
                        <CommandGroup heading="Planning & Schedule">
                            <CommandItem 
                                value="match schedule"
                                onSelect={() => runCommand(() => router.visit(route('fan.match-schedule')))}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer text-gray-300 aria-selected:bg-white/10 aria-selected:text-white transition-all"
                            >
                                <Calendar className="w-4 h-4 text-orange-500" />
                                <span>Match Schedule</span>
                                <CommandShortcut className="text-[10px] text-gray-600">G M</CommandShortcut>
                            </CommandItem>
                            <CommandItem 
                                value="fan itineraries"
                                onSelect={() => runCommand(() => router.visit(route('fan.itineraries')))}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer text-gray-300 aria-selected:bg-white/10 aria-selected:text-white transition-all"
                            >
                                <MapPin className="w-4 h-4 text-red-500" />
                                <span>Fan Itineraries</span>
                                <CommandShortcut className="text-[10px] text-gray-600">G I</CommandShortcut>
                            </CommandItem>
                        </CommandGroup>

                        <CommandSeparator className="bg-white/5" />

                        <CommandGroup heading="Quick Access">
                            <CommandItem 
                                value="home page"
                                onSelect={() => runCommand(() => router.visit(route('index')))}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer text-gray-300 aria-selected:bg-white/10 aria-selected:text-white transition-all"
                            >
                                <Home className="w-4 h-4 text-red-500" />
                                <span>Home Page</span>
                                <CommandShortcut className="text-[10px] text-gray-600">G H</CommandShortcut>
                            </CommandItem>
                            <CommandItem 
                                value="dashboard"
                                onSelect={() => runCommand(() => router.visit(route('dashboard')))}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer text-gray-300 aria-selected:bg-white/10 aria-selected:text-white transition-all"
                            >
                                <LayoutDashboard className="w-4 h-4 text-red-500" />
                                <span>Dashboard</span>
                                <CommandShortcut className="text-[10px] text-gray-600">G D</CommandShortcut>
                            </CommandItem>
                        </CommandGroup>

                        <CommandSeparator className="bg-white/5" />

                        <CommandGroup heading="Settings & Security">
                            <CommandItem 
                                value="my profile"
                                onSelect={() => runCommand(() => router.visit(route('profile.edit')))}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer text-gray-300 aria-selected:bg-white/10 aria-selected:text-white transition-all"
                            >
                                <User className="w-4 h-4 text-blue-500" />
                                <span>My Profile</span>
                                <CommandShortcut className="text-[10px] text-gray-600">G P</CommandShortcut>
                            </CommandItem>
                            <CommandItem 
                                value="security settings"
                                onSelect={() => runCommand(() => router.visit(route('fan.security')))}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer text-gray-300 aria-selected:bg-white/10 aria-selected:text-white transition-all"
                            >
                                <Shield className="w-4 h-4 text-green-500" />
                                <span>Security Settings</span>
                                <CommandShortcut className="text-[10px] text-gray-600">G S</CommandShortcut>
                            </CommandItem>
                        </CommandGroup>

                        <CommandSeparator className="bg-white/5" />

                        <CommandGroup heading="Social & Finance">
                            <CommandItem 
                                value="all tribes"
                                onSelect={() => runCommand(() => router.visit(route('fan.tribes')))}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer text-gray-300 aria-selected:bg-white/10 aria-selected:text-white transition-all"
                            >
                                <Users className="w-4 h-4 text-purple-500" />
                                <span>All Tribes</span>
                            </CommandItem>
                            <CommandItem 
                                value="feed activity"
                                onSelect={() => runCommand(() => router.visit(route('fan.feed')))}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer text-gray-300 aria-selected:bg-white/10 aria-selected:text-white transition-all"
                            >
                                <Bell className="w-4 h-4 text-yellow-500" />
                                <span>Feed & Activity</span>
                            </CommandItem>
                            <CommandItem 
                                value="wallet budgets"
                                onSelect={() => runCommand(() => router.visit(route('fan.payments')))}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer text-gray-300 aria-selected:bg-white/10 aria-selected:text-white transition-all"
                            >
                                <Wallet className="w-4 h-4 text-emerald-500" />
                                <span>My Wallet & Budgets</span>
                                <CommandShortcut className="text-[10px] text-gray-600">G W</CommandShortcut>
                            </CommandItem>
                            <CommandItem 
                                value="payment history"
                                onSelect={() => runCommand(() => router.visit(route('fan.payments')))}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer text-gray-300 aria-selected:bg-white/10 aria-selected:text-white transition-all"
                            >
                                <CreditCard className="w-4 h-4 text-cyan-500" />
                                <span>Payment History</span>
                                <CommandShortcut className="text-[10px] text-gray-600">G B</CommandShortcut>
                            </CommandItem>
                        </CommandGroup>

                        <CommandSeparator className="bg-white/5" />

                        <CommandGroup heading="Account">
                            <CommandItem 
                                value="sign out"
                                onSelect={() => runCommand(() => router.post(route('logout')))}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 cursor-pointer text-red-400 aria-selected:bg-red-500/20 transition-all font-medium"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Sign Out</span>
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </CommandDialog>
            </>
        );
    }
