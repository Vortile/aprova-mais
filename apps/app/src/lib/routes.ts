export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  SIGN_IN: "/entrar",
  SIGN_UP: "/cadastro",
  LOGIN: "/login",
  REGISTER: "/registrar",
  ADMIN: {
    ALUNOS: "/admin/alunos",
    PROFESSORES: "/admin/professores",
    MATERIAIS: "/admin/materiais",
    TAREFAS: "/admin/tarefas",
    RELATORIOS: "/admin/relatorios",
    FINANCEIRO: "/admin/financeiro",
    CONFIGURACOES: "/admin/configuracoes",
    EMAILS: "/admin/emails",
    EVENTOS: "/admin/eventos",
  },
  ALUNO: {
    HOME: "/aluno",
    MATERIAIS: "/aluno/materiais",
    TAREFAS: "/aluno/tarefas",
  },
} as const;
