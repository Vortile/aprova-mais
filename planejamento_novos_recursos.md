# Plano de Desenvolvimento: Comunidade Docente e Controle Operacional

Este documento detalha o planejamento arquitetural, de banco de dados e de interface para a implementação de dois grandes recursos na plataforma **AprovaMais**:
1. **Comunidade Docente**: Compartilhamento facilitado de materiais pedagógicos entre professores.
2. **Controle Operacional de Tempo**: Gerenciamento de calendário, agendamento de aulas por alunos, controle de atrasos e compensação de faltas.

---

## 👥 1. Comunidade Docente

### 📋 Objetivo
Atualmente, a tabela de `public.materiais` é restrita ao professor que realizou o upload (campo `uploaded_by`). O objetivo da **Comunidade Docente** é criar uma área colaborativa (uma nova aba ou página) onde professores possam publicar materiais úteis (apostilas, roteiros de aulas e práticas pedagógicas) para que outros professores possam visualizar, baixar ou clonar para sua própria biblioteca de materiais de forma imediata.

---

### 🗄️ Modelagem de Banco de Dados (Supabase/PostgreSQL)

Para apoiar essa funcionalidade sem inflar o banco de dados desnecessariamente, utilizaremos uma coluna de marcação na tabela `public.materiais` e criaremos uma tabela auxiliar para reações (likes/favoritos).

#### **Alteração na tabela `public.materiais`**
Adicionaremos campos para controlar o compartilhamento e rastrear a origem de materiais clonados:

```sql
-- Adiciona flag de compartilhamento e relacionamento de clone
ALTER TABLE public.materiais 
  ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shared_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cloned_from_id UUID REFERENCES public.materiais(id) ON DELETE SET NULL;

-- Criar índice para buscas rápidas de materiais compartilhados
CREATE INDEX IF NOT EXISTS materiais_is_shared_idx ON public.materiais(is_shared) WHERE is_shared = true;
```

#### **Nova tabela: `public.material_reactions` (Reações/Favoritos)**
Permite que professores curtam ou favoritem materiais, criando um sistema de classificação orgânico das melhores práticas.

```sql
CREATE TABLE public.material_reactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES public.materiais(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(material_id, profile_id)
);

-- Ativar RLS
ALTER TABLE public.material_reactions ENABLE ROW LEVEL SECURITY;
```

---

### 🛡️ Políticas de Segurança (Row Level Security - RLS)

As políticas de acesso para a tabela `public.materiais` devem ser ajustadas para garantir que professores vejam apenas seus próprios materiais **OU** aqueles que foram compartilhados voluntariamente com a comunidade:

```sql
-- Remover políticas de leitura genéricas de professores se existirem
DROP POLICY IF EXISTS "Professores manage materiais" ON public.materiais;

-- Nova política de LEITURA (SELECT) para professores
CREATE POLICY "Professores read own or shared materiais"
  ON public.materiais FOR SELECT
  USING (
    public.is_admin() OR
    uploaded_by = auth.uid() OR
    is_shared = true
  );

-- Nova política de ESCRITA (INSERT, UPDATE, DELETE) para professores
CREATE POLICY "Professores manage own materiais"
  ON public.materiais FOR ALL
  USING (
    public.is_admin() OR
    (public.is_professor() AND uploaded_by = auth.uid())
  )
  WITH CHECK (
    public.is_admin() OR
    (public.is_professor() AND uploaded_by = auth.uid())
  );

-- Políticas para a tabela de reações
CREATE POLICY "Professores read reactions"
  ON public.material_reactions FOR SELECT
  USING (public.is_professor() OR public.is_admin());

CREATE POLICY "Professores manage own reactions"
  ON public.material_reactions FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());
```

---

### 🧠 Server Actions (Lógica de Negócio)

No arquivo `apps/app/src/lib/actions/materiais.ts`, implementaremos duas novas ações cruciais:

1. `toggleShareMaterial(materialId, isShared)`: 
   - Ativa ou desativa a flag `is_shared` de um material do próprio professor.
2. `cloneMaterialToLibrary(materialId)`:
   - Duplica o registro do material na tabela `public.materiais`.
   - Define o `uploaded_by` como o ID do professor atual.
   - Define `is_shared` como `false` (inicia como privado na biblioteca do novo professor).
   - Aponta `cloned_from_id` para o material original de comunidade.
   - **Vantagem de Armazenamento**: O link de arquivo `file_url` (armazenado de forma privada no bucket do Supabase `aprova+`) é reaproveitado diretamente, evitando duplicar arquivos físicos e economizando armazenamento de forma inteligente, enquanto permite que o professor personalize o título e a descrição do material e o atribua aos seus próprios alunos.

---

### 🎨 Interface do Usuário (UX/UI)

Na página atual `/admin/materiais`, substituiremos a listagem simples por uma interface de duas abas utilizando o componente `<Tabs>` do shadcn/ui:

#### **Aba 1: Meus Materiais (Aba Padrão)**
* **Listagem pessoal**: Apenas materiais criados pelo próprio professor.
* **Ações**: Adicionar, editar, deletar, associar a alunos.
* **Indicador de Compartilhamento**: Um interruptor (Switch) ou badge visual indicando o status na comunidade:
  * `Privado` (Cinza)
  * `Compartilhado na Comunidade` (Verde 🚀)

#### **Aba 2: Biblioteca da Comunidade (Nova)**
* **Listagem Coletiva**: Mostra todos os materiais de outros professores onde `is_shared = true`.
* **Filtros rápidos**: Busca textual por título, filtro por Disciplina (`subject`) e Série (`grade_level`).
* **Visualização de Autoria**: Exibe o nome do professor autor (`uploader_name` via JOIN com `profiles`) e um contador de reações (Likes).
* **Ação de Importação rápida**: Botão "Importar para Meus Materiais" que executa o clone em segundo plano e exibe um Toast de sucesso. Após importado, o material torna-se imediatamente utilizável para ser enviado aos alunos daquele professor.

---
---

## 📅 2. Controle Operacional de Tempo

### 📋 Objetivo
Implementar o controle operacional completo dos horários escolares. O sistema deve permitir que professores publiquem suas agendas de disponibilidade, que alunos reservem aulas de acordo com essas agendas, que atrasos sejam medidos e que faltas gerem créditos automáticos de compensação a serem reagendados de forma autônoma.

---

### 🗄️ Modelagem de Banco de Dados (Supabase/PostgreSQL)

Criaremos duas tabelas fundamentais: `disponibilidades_professor` e `agendamentos`.

#### **1. Tabela `public.disponibilidades_professor`**
Define as janelas de tempo em que um professor está disponível para dar aulas. Pode ser baseada em dias da semana recorrentes.

```sql
CREATE TABLE public.disponibilidades_professor (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week  INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Domingo, 1 = Segunda, etc.
  start_time   TIME NOT NULL, -- Ex: '14:00:00'
  end_time     TIME NOT NULL, -- Ex: '15:30:00'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_times CHECK (start_time < end_time)
);

ALTER TABLE public.disponibilidades_professor ENABLE ROW LEVEL SECURITY;
```

#### **2. Tabela `public.agendamentos` (Aulas / Reservas)**
Registra os agendamentos concretos, o status da aula e o controle minucioso de presença, atraso e compensação.

```sql
CREATE TABLE public.agendamentos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id            UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  professor_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time          TIMESTAMPTZ NOT NULL,
  end_time            TIMESTAMPTZ NOT NULL,
  
  -- Controle de Status do Agendamento
  status              TEXT NOT NULL DEFAULT 'pendente' 
                      CHECK (status IN ('pendente', 'confirmado', 'cancelado', 'concluido')),
  
  -- Controle Operacional de Presença e Atrasos
  presenca            TEXT NOT NULL DEFAULT 'pendente'
                      CHECK (presenca IN ('pendente', 'presente', 'atrasado_aluno', 'atrasado_professor', 'falta_justificada', 'falta_injustificada')),
  atraso_minutos      INTEGER NOT NULL DEFAULT 0,
  
  -- Controle de Compensação de Faltas
  compensation_for_id UUID REFERENCES public.agendamentos(id) ON DELETE SET NULL, -- Se esta aula for a reposição de uma falta anterior
  
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_booking_times CHECK (start_time < end_time)
);

-- Ativar RLS e Índices de busca temporal
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS agendamentos_tempo_idx ON public.agendamentos(professor_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS agendamentos_aluno_idx ON public.agendamentos(aluno_id);
```

#### **3. Campo Adicional na Tabela de Alunos**
Para otimizar a exibição e integridade dos créditos de compensação do aluno, adicionaremos uma coluna de controle direto em `public.alunos`:

```sql
ALTER TABLE public.alunos 
  ADD COLUMN IF NOT EXISTS creditos_compensacao INTEGER NOT NULL DEFAULT 0 CHECK (creditos_compensacao >= 0);
```

---

### 🛡️ Políticas de Segurança (Row Level Security - RLS)

```sql
-- Políticas para Disponibilidades
CREATE POLICY "Alunos read their professor availabilities"
  ON public.disponibilidades_professor FOR SELECT
  USING (
    public.is_admin() OR 
    professor_id IN (
      SELECT professor_id FROM public.alunos WHERE profile_id = auth.uid()
    ) OR
    professor_id = auth.uid()
  );

CREATE POLICY "Professores manage own availability"
  ON public.disponibilidades_professor FOR ALL
  USING (public.is_admin() OR professor_id = auth.uid())
  WITH CHECK (public.is_admin() OR professor_id = auth.uid());

-- Políticas para Agendamentos
CREATE POLICY "Users read own agendamentos"
  ON public.agendamentos FOR SELECT
  USING (
    public.is_admin() OR
    professor_id = auth.uid() OR
    aluno_id IN (SELECT id FROM public.alunos WHERE profile_id = auth.uid())
  );

CREATE POLICY "Professores manage their agendamentos"
  ON public.agendamentos FOR ALL
  USING (public.is_admin() OR professor_id = auth.uid())
  WITH CHECK (public.is_admin() OR professor_id = auth.uid());

CREATE POLICY "Alunos insert and update own agendamentos"
  ON public.agendamentos FOR INSERT
  WITH CHECK (
    aluno_id IN (SELECT id FROM public.alunos WHERE profile_id = auth.uid())
  );
```

---

### 🔄 Fluxos de Trabalho Operacionais

#### **A. Fluxo de Agendamento por Alunos**
1. O aluno acessa a aba **Agenda** na sua área `/aluno`.
2. O sistema verifica o professor responsável associado ao registro do aluno (`professor_id`).
3. O aluno vê os horários disponíveis do professor (`disponibilidades_professor`) e os slots de agendamento já tomados para aquela semana.
4. O aluno escolhe um slot livre e clica em **Agendar**.
   * Se o aluno possuir `creditos_compensacao > 0`, ele pode marcar a opção "Utilizar crédito de reposição".
5. O agendamento é criado com `status = 'pendente'`.
6. O professor visualiza a pendência no seu painel e aprova (muda status para `confirmado`) ou recusa (muda status para `cancelado` com justificativa).
   * Se aprovado como reposição, abate-se 1 do saldo de `creditos_compensacao` do aluno.

#### **B. Fluxo de Aula de Reposição e Compensação de Faltas**
As regras operacionais de faltas e compensações funcionam da seguinte forma:
* **Falta Justificada (Aviso prévio)**: Caso o aluno avise que irá faltar com antecedência aceitável, o professor altera o status da aula para `concluido` (ou cancelado por falta) e marca a presença como `falta_justificada`.
  * **Ação Automática (Trigger ou Server Action)**: O sistema soma `+1` na coluna `creditos_compensacao` da tabela do aluno correspondente.
  * O aluno recebe uma notificação visual na sua tela principal: *"Você tem 1 crédito de reposição disponível para agendar!"*.
* **Falta Injustificada**: Marcada se o aluno simplesmente não comparecer sem justificativa plausível ou aviso prévio. A presença é definida como `falta_injustificada`, a aula é contada como dada/faturada e nenhum crédito de reposição é gerado.

#### **C. Controle de Atrasos**
Ao término de cada aula, o professor realiza a chamada:
* Define a presença como `atrasado_aluno` ou `atrasado_professor` e informa os minutos excedidos (campo `atraso_minutos`).
* Estes dados são salvos para compor relatórios de pontualidade para os pais dos alunos.

---

### 🎨 Interfaces do Usuário (UX/UI)

#### **1. Área do Professor (`/admin/agenda`)**
* **Visualização de Calendário Semanal**: Componente visual de calendário onde o professor vê de forma clara suas aulas marcadas na semana.
* **Painel de Pendências**: Lista de requisições de agendamento feitas por alunos esperando confirmação.
* **Modal de Fechamento de Aula**: Ao clicar em uma aula do dia, abre-se um modal interativo:
  * Campo de chamada: `Presente`, `Falta Justificada`, `Falta Injustificada`, `Atrasado`.
  * Input numérico para minutos de atraso (se houver).
  * Campo para observações da aula.
  * **Integração Inteligente com Relatórios**: O preenchimento deste modal pode criar automaticamente um rascunho de **Relatório Pedagógico** (`relatorios_pedagogicos`) pré-preenchido com a data e matérias daquele dia, economizando tempo precioso de preenchimento duplo do professor!

#### **2. Área do Aluno (`/aluno/agenda`)**
* **Widget de Próxima Aula**: Card na dashboard indicando o dia, hora e professor da próxima sessão.
* **Saldo de Compensações**: Um painel indicador: *"Você possui X aulas de reposição a agendar"*.
* **Formulário de Agendamento Amigável**: Tela interativa de escolha de dia/hora com base nas disponibilidades reais do seu professor.

---

## 📈 Próximos Passos Recomendados

Para implementar essas melhorias de forma ágil e segura, sugere-se a divisão do trabalho em fases:

1. **Fase 1 (Banco de Dados e RLS)**: Criação das migrações do Supabase com as tabelas de disponibilidade, agendamento, reações e campos adicionais.
2. **Fase 2 (Comunidade Docente)**: Desenvolvimento das Server Actions de clonagem e da interface de Abas em `/admin/materiais`.
3. **Fase 3 (Calendário do Professor)**: Desenvolvimento da visualização de calendário e modal de fechamento de aula para preenchimento de presença/atrasos.
4. **Fase 4 (Painel do Aluno e Agendamento)**: Criação da visualização de calendário e fluxo de solicitação de agendamento pelo aluno, incluindo abatimento de créditos.
