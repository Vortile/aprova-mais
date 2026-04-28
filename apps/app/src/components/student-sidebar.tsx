"use client";

import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ClipboardList, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BrandLockup } from "@/components/brand-lockup";
import { ROUTES } from "@/lib/routes";

const navItems = [
  { href: ROUTES.ALUNO.MATERIAIS, label: "Materiais", icon: BookOpen },
  { href: ROUTES.ALUNO.TAREFAS, label: "Tarefas", icon: ClipboardList },
];

interface StudentSidebarProps {
  userName: string | null;
  userEmail: string;
}

export function StudentSidebar({ userName, userEmail }: StudentSidebarProps) {
  const { signOut } = useClerk();
  const pathname = usePathname();
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : (userEmail[0]?.toUpperCase() ?? "A");

  return (
    <Sidebar>
      <SidebarContent>
        <div className="px-4 py-4">
          <BrandLockup size="sm" />
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            Área do Aluno
          </p>
        </div>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Minha Área</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-10">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left min-w-0">
                    <span className="text-sm font-medium truncate">
                      {userName ?? "Aluno"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {userEmail}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-52">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => void signOut({ redirectUrl: ROUTES.SIGN_IN })}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
