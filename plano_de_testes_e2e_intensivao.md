# Plano de Testes — Intensivão ENEM Medicina (Checkout + Eventos)

Este documento cobre a estratégia de testes completa do fluxo de inscrição e pagamento do Intensivão: testes unitários (já implementados), o roteiro de testes ponta a ponta em **sandbox** (para rodar livremente, sem gastar dinheiro real) e o roteiro de **1 teste em produção** (dinheiro real, executado uma única vez antes do lançamento oficial).

---

## 1. Testes Unitários (já implementados e passando)

Rodar com:

```bash
pnpm --filter @repo/web test   # 26 testes
pnpm --filter @repo/app test   # 4 testes
# ou, na raiz:
pnpm test                      # roda os dois via turbo
```

| Arquivo                                             | O que cobre                                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/web/src/lib/evento/format.test.ts`            | Validação de CPF (checksum real), formatação de CPF/WhatsApp, cálculo de idade (incluindo aniversário "hoje", "ainda não chegou este ano") |
| `apps/web/src/lib/validations/inscricao.test.ts`    | Schema Zod do formulário: e-mail/CPF/WhatsApp inválidos, série obrigatória, campos de responsável obrigatórios para menores de idade       |
| `apps/web/src/lib/evento/webhook-signature.test.ts` | Validação HMAC da assinatura do webhook do Mercado Pago: assinatura correta, adulterada, ausente, sem secret configurado                   |
| `apps/app/src/lib/email/drip-schedule.test.ts`      | Cálculo das datas da régua de e-mail (D+2/D+4/D+6, checklist pré-evento, devolutivas, pós-evento condicionado à data do 3º sábado)         |

**O que ainda não está coberto por unit tests (e por quê):** a função Postgres `confirmar_pagamento_evento` (lógica de alocação atômica de turma) só pode ser testada de verdade contra um banco Postgres real — por isso ela é validada no roteiro de E2E abaixo, não em unit test.

---

## 2. Pré-requisitos para os testes de Sandbox

- Servidor `apps/web` rodando em `http://localhost:3001` (`pnpm --filter @repo/web dev`)
- Servidor `apps/app` rodando em `http://localhost:3000` (`pnpm --filter @repo/app dev`)
- `apps/web/.env.local` com as credenciais de **TESTE** do Mercado Pago já configuradas (ver arquivo — não versionado no Git)
- Conta de comprador de teste do Mercado Pago (login separado, documentado no `.env.local`) para simular o pagador em outra aba/navegador anônimo, se necessário
- Cartões de teste (documentados no `.env.local`): Mastercard, Visa, Amex, Elo Débito — todos aprovam automaticamente no sandbox
- Ngrok (ou similar) **apenas se for necessário testar o webhook real** vindo do Mercado Pago sandbox até o `localhost:3001/api/webhooks/mercadopago` (o Mercado Pago não consegue alcançar `localhost` diretamente)

---

## 3. Roteiro E2E — Sandbox (rodar livremente)

### 3.1 Landing Page & Tracking

1. Acessar `http://localhost:3001/intensivao-medicina`.
2. Verificar: hero mostra "3 Sábados", contador de vagas restantes (26 se banco vazio), cronograma com 3 blocos (12/09, 19/09, 26/09).
3. Confirmar no Supabase (`evento_analytics`) que um registro `page_view` foi inserido.
4. Clicar no CTA "Garantir Minha Vaga" → confirmar registro `cta_click` e redirecionamento para `/intensivao-medicina/inscricao`.

### 3.2 Formulário de Inscrição — Validações

1. Tentar enviar o formulário vazio → todos os campos obrigatórios devem mostrar erro.
2. Preencher CPF inválido (ex: `111.111.111-11`) → erro "Informe um CPF válido".
3. Preencher data de nascimento que resulte em idade < 18 → campos "Nome do responsável" e "WhatsApp do responsável" devem aparecer e ser obrigatórios.
4. Preencher tudo corretamente com uma pessoa adulta → deve avançar para o Passo 2 (Pagamento) e criar uma linha em `evento_inscricoes` com `status_pagamento = 'pendente'`.

### 3.3 Fluxo PIX (sandbox)

1. No Payment Brick, escolher **Pix**.
2. Confirmar que o QR Code aparece na tela (nosso design, não o do Mercado Pago) e que existe o botão "Copiar código Pix Copia e Cola".
3. Confirmar em `evento_analytics` o evento `pix_generated`.
4. **Aprovar o pagamento no sandbox:**
   - Opção A: usar o app do Mercado Pago sandbox (login com a conta de comprador de teste) e pagar o Pix normalmente — o sandbox aprova automaticamente em segundos.
   - Opção B (mais rápida, sem precisar do app): no painel de desenvolvedores do Mercado Pago, existe a opção de simular a aprovação de um pagamento Pix de teste diretamente pela API/painel.
5. Aguardar o polling do front (a cada 4s) — a tela deve mudar automaticamente para "Pagamento confirmado! Vaga garantida 🎉" e mostrar a Turma/Sala.
6. Verificar no banco:
   - `evento_inscricoes.status_pagamento = 'aprovado'`, `turma_alocada`, `sala_alocada`, `horario_turma`, `numero_confirmacao` preenchidos.
   - `evento_analytics` tem o evento `payment_approved`.
   - `evento_email_log` tem uma linha `ticket_confirmacao`.
7. Verificar que o e-mail do ingresso chegou (Resend) com QR Code e dados corretos.
8. Recarregar `/admin/eventos` → "Vagas Confirmadas" deve subir para 1/26, e a inscrição deve aparecer na tabela.

### 3.4 Fluxo Cartão de Crédito (sandbox)

1. Repetir o passo 3.2 com uma nova inscrição.
2. No Payment Brick, escolher **Cartão de Crédito** e usar um dos cartões de teste salvos no `.env.local` (ex: Mastercard `5480 8328 0103 3311`, venc. `11/30`, CVV `123`, nome/CPF quaisquer válidos).
3. Confirmar aprovação **imediata** (sem polling — o Brick já retorna `approved` na hora).
4. Repetir as verificações de banco/e-mail do item 3.3 (passos 6–8), mas com `forma_pagamento = 'credit_card'`.
5. **Teste de recusa:** usar um cartão de teste marcado para recusa (ver documentação do Mercado Pago sandbox — normalmente existe um cartão específico para simular `rejected`) e confirmar que a mensagem de erro aparece corretamente na tela, sem travar o formulário.

### 3.5 Alocação de Turma (Sala 1 → Sala 2 → Esgotado)

1. Repetir o fluxo de pagamento (PIX é mais rápido de simular em lote) até acumular **13 pagamentos aprovados**.
2. Confirmar que os 13 primeiros ficaram com `turma_alocada = 1` e `sala_alocada = 'Sala HY'`.
3. Aprovar o **14º pagamento** → confirmar `turma_alocada = 2`.
4. Continuar até **26 aprovados** → tentar criar uma 27ª inscrição:
   - A landing page deve mostrar "Vagas esgotadas".
   - `criarInscricaoAction` deve recusar com a mensagem de vagas esgotadas, **antes mesmo de chegar ao pagamento**.
5. **Teste de concorrência (opcional, avançado):** disparar 2–3 confirmações de pagamento em paralelo próximas do limite de 26 e confirmar que a função `confirmar_pagamento_evento` nunca aloca mais que 26 vagas (a trava `for update` na tabela `eventos` deve serializar).

### 3.6 Painel Admin

1. `/admin/eventos`: conferir funil de conversão (contagem de sessões únicas por etapa), faturamento bruto, ocupação de salas.
2. Editar as datas dos 3 sábados / horário / nome das salas e salvar → confirmar que persiste no banco (`eventos.data_sabado_1..3`, `horario_geral`, `sala_turma_1/2`).
3. Marcar check-in de um aluno aprovado nos dias 1, 2 e 3 → confirmar upsert em `evento_checkins` (não deve duplicar se clicar duas vezes no mesmo dia).
4. Clicar em "Reenviar ingresso" → confirmar novo e-mail chega (via rota interna `apps/web/api/internal/reenviar-ingresso`, autenticada com `INTERNAL_ADMIN_SECRET`).

### 3.7 Régua de E-mails (Cron)

1. Ajustar manualmente no banco o campo `pago_em` de uma inscrição aprovada para "2 dias atrás" (simulando o tempo já ter passado).
2. Chamar manualmente a rota do cron: `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/evento-emails`.
3. Confirmar que o e-mail `guia_preparacao` foi enviado e logado em `evento_email_log` (e que rodar de novo **não** duplica o envio).
4. Repetir ajustando `data_sabado_1` para "2 dias no futuro" e confirmar o disparo do `checklist_evento`.

### 3.8 Webhook — Segurança

1. Enviar um POST manual para `/api/webhooks/mercadopago` sem headers de assinatura, com `MERCADOPAGO_WEBHOOK_SECRET` configurado → deve retornar `401 invalid_signature`.
2. Repetir com uma assinatura válida (calculada com o secret) → deve processar normalmente.
3. Confirmar que, mesmo com uma assinatura válida forjada para um `payment_id` real mas não aprovado de verdade, o sistema **sempre** rebusca o status diretamente na API do Mercado Pago antes de confirmar (não confia no corpo do webhook).

---

## 4. Roteiro — 1 Teste em Produção (dinheiro real)

⚠️ **Rodar isso uma única vez, antes do lançamento oficial, com supervisão.** Objetivo: validar que a integração real (credenciais `APP_USR-...`, domínio de produção, webhook público) funciona de ponta a ponta, sem depender só do sandbox.

### Preparação

1. Configurar as variáveis de produção **apenas no ambiente de produção** (Vercel ou similar), nunca no `.env.local`:
   - `MERCADOPAGO_ACCESS_TOKEN` = token `APP_USR-...`
   - `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` = chave pública `APP_USR-...`
   - `MERCADOPAGO_WEBHOOK_SECRET` = configurar o secret real no painel do Mercado Pago e aqui
2. Confirmar que o domínio de produção está acessível publicamente (o webhook do Mercado Pago precisa alcançar `https://seu-dominio/api/webhooks/mercadopago`).
3. Avisar o Prof. Deuticilam / responsável financeiro que uma cobrança real de **R$ 500,00** vai ocorrer e será estornada logo em seguida.

### Execução

1. Acessar a landing page de produção e se inscrever com dados reais (pode ser um cadastro do próprio administrador/testador).
2. Pagar via **PIX real** (o método mais barato de estornar/reverter — ou, se preferir, cartão de crédito real).
3. Confirmar:
   - Webhook de produção recebido e processado (checar logs do Vercel).
   - `evento_inscricoes` atualizado para `aprovado` com turma/sala corretas.
   - E-mail de ingresso real chega na caixa de entrada (não no spam).
   - Painel `/admin/eventos` em produção reflete a vaga confirmada.
4. **Reverter a cobrança:** estornar o pagamento pelo painel do Mercado Pago (Atividades → localizar o pagamento → Devolver). PIX é estornável dentro de instantes a poucos dias, dependendo da política do Mercado Pago — confirmar prazo direto no painel deles antes de prosseguir.
5. Marcar manualmente a inscrição de teste como `cancelado` no banco (ou apagar a linha) para não contar como uma vaga real ocupada.

### Critério de sucesso

- [ ] Pagamento real processado e refletido no painel em menos de 1 minuto após a confirmação.
- [ ] E-mail de ingresso real recebido com QR Code correto.
- [ ] Webhook de produção validado com assinatura real (não em modo "sem secret").
- [ ] Estorno realizado com sucesso e registro de teste removido/cancelado do banco de produção.

---

## 5. Limitações conhecidas / fora do escopo automatizado

- Não há testes automatizados de integração contra a API real do Mercado Pago (sandbox ou produção) — todos os passos das seções 3 e 4 são **manuais**, guiados por este roteiro.
- Não há testes de carga (ex: 26 pagamentos aprovados simultaneamente) além da verificação pontual sugerida em 3.5.
- O envio de e-mails (Resend) não é testado automaticamente — a verificação é sempre visual (chegou ou não chegou na caixa de entrada).

---

## 6. Achados da primeira rodada de testes manuais (16/08/2026)

Rodei o fluxo completo pelo navegador (registro → Payment Brick) contra as credenciais de **sandbox**. Resultado:

- ✅ Landing page, contador de vagas, formulário e suas validações (CPF, idade, campos de responsável) funcionaram perfeitamente.
- ✅ `criarInscricaoAction` cria a inscrição corretamente e avança para o Passo 2.
- 🐛 **Bug real encontrado e corrigido:** o Payment Brick exigia um callback `onReady` (mesmo vazio) além de `onSubmit`/`onError` — sem ele, o Brick lançava `Callbacks onReady and/or onError are required` e nunca renderizava. Corrigido em [payment-brick.tsx](apps/web/src/app/intensivao-medicina/inscricao/payment-brick.tsx).
- 🐛 **Configuração local corrigida:** `apps/web/.env` estava com `SUPABASE_SERVICE_ROLE_KEY` vazia (só `apps/app/.env` tinha o valor real). Corrigido copiando o mesmo valor, já que os dois apps usam o mesmo projeto Supabase.
- ⚠️ **Bloqueio externo (conta Mercado Pago, não é bug de código):** ao tentar gerar o Pix, a API retornou `communication_error` (erro genérico). Segundo a [documentação oficial do Checkout Transparente](https://www.mercadopago.com.br/developers/en/docs/checkout-api-orders/overview), **é pré-requisito ter uma chave Pix registrada na conta vendedora** (inclusive na conta de teste) antes de conseguir gerar cobranças Pix. **Ação necessária:** registrar uma chave Pix na conta de teste (e depois na conta de produção) pelo painel do Mercado Pago.
- ⚠️ O formulário de Cartão de Crédito do Brick ficou preso em estado de "esqueleto" (skeleton) carregando indefinidamente nesta sessão de testes — os campos seguros (`secure-fields.mercadopago.com`) não terminaram de carregar. Não foi possível confirmar se é o mesmo problema de configuração da conta ou um problema de rede do ambiente de teste. **Próximo passo:** repetir o teste de cartão depois de resolver a pendência do Pix acima, já com a conta de teste totalmente configurada.
