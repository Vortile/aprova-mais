export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  SIGN_IN: "/entrar",
  SIGN_UP: "/sign-up",
  LOGIN: "/login",
  REGISTER: "/registrar",
  ADMIN: {
    ALUNOS: "/admin/alunos",
    PROFESSORES: "/admin/professores",
    MATERIAIS: "/admin/materiais",
    TAREFAS: "/admin/tarefas",
    FINANCEIRO: "/admin/financeiro",
    CONFIGURACOES: "/admin/configuracoes",
    DEPOIMENTOS: "/admin/depoimentos",
  },
  ALUNO: {
    HOME: "/aluno",
    MATERIAIS: "/aluno/materiais",
    TAREFAS: "/aluno/tarefas",
  },
} as const;
