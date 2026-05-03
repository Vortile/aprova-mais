"use client";

import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  DollarSign,
  ExternalLink,
  LogOut,
  MessageSquareQuote,
  Settings,
  UserCog,
  Users,
} from "lucide-react";
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
import type { AppRole } from "@/lib/supabase/env";

const ADMIN_ONLY_HREFS = new Set<string>([
  ROUTES.ADMIN.PROFESSORES,
  ROUTES.ADMIN.FINANCEIRO,
  ROUTES.ADMIN.DEPOIMENTOS,
]);

const navItems = [
  {
    label: "Plataforma",
    items: [
      { href: ROUTES.ADMIN.ALUNOS, label: "Alunos", icon: Users },
      { href: ROUTES.ADMIN.PROFESSORES, label: "Professores", icon: UserCog },
      { href: ROUTES.ADMIN.MATERIAIS, label: "Materiais", icon: BookOpen },
      { href: ROUTES.ADMIN.TAREFAS, label: "Tarefas", icon: ClipboardList },
      { href: ROUTES.ADMIN.FINANCEIRO, label: "Financeiro", icon: DollarSign },
      {
        href: ROUTES.ADMIN.DEPOIMENTOS,
        label: "Depoimentos",
        icon: MessageSquareQuote,
      },
    ],
  },
  {
    label: "Conta",
    items: [
      {
        href: ROUTES.ADMIN.CONFIGURACOES,
        label: "Configurações",
        icon: Settings,
      },
    ],
  },
];

interface AdminSidebarProps {
  userName: string | null;
  userEmail: string;
  userRole: AppRole;
}

export function AdminSidebar({
  userName,
  userEmail,
  userRole,
}: AdminSidebarProps) {
  const isAdmin = userRole === "admin";
  const { signOut } = useClerk();
  const pathname = usePathname();
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : (userEmail[0]?.toUpperCase() ?? "P");

  return (
    <Sidebar>
      <SidebarContent>
        <div className="px-2 pt-2 mb-0!">
          <BrandLockup size="sm" />
        </div>
        <SidebarSeparator />
        {navItems.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items
                  .filter((item) => isAdmin || !ADMIN_ONLY_HREFS.has(item.href))
                  .map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                      >
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
        ))}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Agenda</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a
                      href="https://zcal.co/home"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <CalendarDays className="h-4 w-4" />
                      <span>Gerenciar Agenda</span>
                      <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
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
                      {userName ?? "Professor"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {userEmail}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-52">
                <DropdownMenuItem asChild>
                  <Link href="/admin/configuracoes">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
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
