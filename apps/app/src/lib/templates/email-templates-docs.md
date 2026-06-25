# Documentação de Templates de E-mails – Aprova+

Este documento consolida as diretrizes visuais e os templates HTML/Plaintext oficiais do sistema **Aprova+**. Os e-mails são estruturados seguindo rígidos padrões de entregabilidade e legibilidade (incluindo responsividade em dispositivos móveis e suporte aos clientes Outlook, Gmail e Apple Mail).

---

## 🎨 Diretrizes Visuais Gerais (Padrão de Trust)

Todos os e-mails HTML gerados programaticamente ou enviados manualmente devem obedecer aos seguintes princípios:
1. **Paleta de Cores**:
   * **Azul Escuro (Principal)**: `#1e535c` ou `#1e616c` (Cor da marca)
   * **Marrom/Bronze (Destaque)**: `#854710`
   * **Cinza de Apoio (Texto)**: `#4b5563`
   * **Fundo**: `#fbfbfa`
2. **Largura Máxima**: `600px` para evitar quebras de visualização.
3. **Imagens**: Sempre incluir alt text descritivo. O rodapé oficial (`email-footer.jpg` no tamanho de `600x150px`) é anexado como inline `cid:email-footer` automaticamente pelo backend para aumentar a entregabilidade.
4. **Legislação & Compliance**: Todo e-mail transacional ou de marketing contém o rodapé de identificação legal da empresa e link direto de cancelamento de inscrição/contato.

---

## 📩 1. Convite de Novo Usuário (Alunos / Professores)

**Assunto Sugerido**: `Você foi convidado para a plataforma Aprova+!`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aprova+ - Convite</title>
</head>
<body style="margin:0;padding:0;background-color:#fbfbfa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fbfbfa;padding:20px 0;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff;border:1px solid #eaeaea;border-radius:12px;overflow:hidden;padding:40px;">
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding-bottom:30px;">
              <span style="font-size:24px;font-weight:bold;color:#1e535c;letter-spacing:-0.5px;">Aprova+</span>
            </td>
          </tr>
          <!-- Title -->
          <tr>
            <td style="padding-bottom:20px;">
              <h1 style="font-size:20px;line-height:28px;color:#111827;margin:0;font-weight:700;">Seja muito bem-vindo(a) ao Aprova+!</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding-bottom:30px;font-size:15px;line-height:24px;color:#4b5563;">
              <p style="margin:0 0 16px 0;">Olá, <strong>{{{NAME}}}</strong>!</p>
              <p style="margin:0 0 16px 0;">Você foi cadastrado por um de nossos administradores na plataforma <strong>Aprova+</strong> para iniciar sua jornada de aulas particulares e acompanhamento pedagógico personalizado.</p>
              <p style="margin:0 0 16px 0;">Sua conta de acesso está pré-configurada sob o perfil de <strong>{{{ROLE}}}</strong>.</p>
              <p style="margin:0 0 16px 0;">Para ativar seu perfil, criar sua senha de acesso e explorar o dashboard de acompanhamento, relatórios e tarefas, clique no botão de ativação abaixo:</p>
            </td>
          </tr>
          <!-- Button -->
          <tr>
            <td align="center" style="padding-bottom:30px;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color:#1e535c;border-radius:8px;">
                    <a href="{{{INVITE_URL}}}" target="_blank" style="display:inline-block;padding:14px 30px;font-size:14px;color:#ffffff;text-decoration:none;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Ativar Minha Conta</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Expiracy warning -->
          <tr>
            <td style="font-size:12px;line-height:18px;color:#9ca3af;padding-bottom:10px;">
              <p style="margin:0;">Este link de ativação é de uso exclusivo e expira em 7 dias. Se você não solicitou este cadastro, por favor desconsidere este e-mail.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 📝 2. Alerta de Entrega de Tarefa (Conclusão / Correção)

**Assunto Sugerido**: `Tarefa Concluída: {{{TAREFA_TITLE}}}` ou `Feedback de Tarefa Disponível`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aprova+ - Entrega de Tarefa</title>
</head>
<body style="margin:0;padding:0;background-color:#fbfbfa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fbfbfa;padding:20px 0;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff;border:1px solid #eaeaea;border-radius:12px;overflow:hidden;padding:40px;">
          <tr>
            <td align="left" style="padding-bottom:20px;border-bottom:1px solid #eaeaea;">
              <span style="font-size:18px;font-weight:bold;color:#1e535c;">Aprova+ • Atividades</span>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 0 20px 0;">
              <h2 style="font-size:18px;color:#111827;margin:0;font-weight:700;">Sua atividade foi avaliada ou entregue com sucesso!</h2>
            </td>
          </tr>
          <tr>
            <td style="font-size:14px;line-height:22px;color:#4b5563;padding-bottom:35px;">
              <p style="margin:0 0 12px 0;">Olá, <strong>{{{STUDENT_NAME}}}</strong>!</p>
              <p style="margin:0 0 16px 0;">Temos atualizações sobre a tarefa: <strong style="color:#111827;">{{{TAREFA_TITLE}}}</strong>.</p>
              <div style="background-color:#f3f4f6;border-radius:8px;padding:15px;margin-bottom:16px;border-left:4px solid #1e535c;">
                <p style="margin:0 0 8px 0;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;font-weight:600;">Status da Atividade</p>
                <p style="margin:0;font-size:14px;font-weight:bold;color:#1e535c;">{{{STATUS_LABEL}}}</p>
              </div>
              <p style="margin:0 0 16px 0;">Para conferir as notas, baixar materiais de apoio adicionais ou ler o feedback detalhado do seu professor, acesse seu painel clicando abaixo:</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:10px;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color:#1e535c;border-radius:8px;">
                    <a href="{{{TAREFA_URL}}}" target="_blank" style="display:inline-block;padding:12px 24px;font-size:13px;color:#ffffff;text-decoration:none;font-weight:600;">Visualizar Detalhes no Painel</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## ⏳ 3. Alerta de Vencimento de Tarefa (4 Dias Antes)

**Assunto Sugerido**: `Lembrete: {{{TAREFA_TITLE}}} vence em 4 dias!`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aprova+ - Lembrete de Prazo</title>
</head>
<body style="margin:0;padding:0;background-color:#fbfbfa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fbfbfa;padding:20px 0;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff;border:1px solid #eaeaea;border-radius:12px;overflow:hidden;padding:40px;">
          <tr>
            <td align="left" style="padding-bottom:15px;border-bottom:1px solid #eaeaea;">
              <span style="font-size:16px;font-weight:bold;color:#854710;">⚠️ Lembrete de Prazo • Aprova+</span>
            </td>
          </tr>
          <tr>
            <td style="padding:25px 0 15px 0;">
              <h2 style="font-size:18px;color:#111827;margin:0;font-weight:700;">Faltam 4 dias para a entrega!</h2>
            </td>
          </tr>
          <tr>
            <td style="font-size:14px;line-height:22px;color:#4b5563;padding-bottom:30px;">
              <p style="margin:0 0 12px 0;">Olá, <strong>{{{STUDENT_NAME}}}</strong>!</p>
              <p style="margin:0 0 16px 0;">Este é um lembrete amigável de que o prazo de entrega para a sua tarefa <strong style="color:#111827;">"{{{TAREFA_TITLE}}}"</strong> está se aproximando.</p>
              <p style="margin:0 0 16px 0;">🗓️ <strong>Data Limite:</strong> {{{DUE_DATE}}}</p>
              <p style="margin:0 0 16px 0;">Organize-se com calma para realizar e enviar sua atividade. Se tiver dúvidas no conteúdo, sinta-se à vontade para enviar uma mensagem ao seu professor orientador pelo sistema.</p>
            </td>
          </tr>
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color:#1e535c;border-radius:8px;">
                    <a href="{{{TAREFA_URL}}}" target="_blank" style="display:inline-block;padding:12px 24px;font-size:13px;color:#ffffff;text-decoration:none;font-weight:600;">Ver Tarefa e Materiais</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 🚨 4. Alerta Urgente de Vencimento de Tarefa (24 Horas Antes)

**Assunto Sugerido**: `🚨 Urgente: {{{TAREFA_TITLE}}} vence amanhã!`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aprova+ - Lembrete Urgente</title>
</head>
<body style="margin:0;padding:0;background-color:#fbfbfa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fbfbfa;padding:20px 0;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff;border:1px solid #ffccd1;border-radius:12px;overflow:hidden;padding:40px;">
          <tr>
            <td align="left" style="padding-bottom:15px;border-bottom:1px solid #ffccd1;">
              <span style="font-size:16px;font-weight:bold;color:#b91c1c;">🚨 ATENÇÃO • Prazo Crítico</span>
            </td>
          </tr>
          <tr>
            <td style="padding:25px 0 15px 0;">
              <h2 style="font-size:18px;color:#b91c1c;margin:0;font-weight:700;">Sua atividade vence em menos de 24 horas!</h2>
            </td>
          </tr>
          <tr>
            <td style="font-size:14px;line-height:22px;color:#4b5563;padding-bottom:30px;">
              <p style="margin:0 0 12px 0;">Olá, <strong>{{{STUDENT_NAME}}}</strong>!</p>
              <p style="margin:0 0 16px 0;">Atenção redobrada: o prazo limite de envio para a tarefa <strong style="color:#111827;">"{{{TAREFA_TITLE}}}"</strong> expira **amanhã**.</p>
              <p style="margin:0 0 16px 0;">🗓️ <strong>Data Limite de Envio:</strong> <span style="color:#b91c1c;font-weight:bold;">{{{DUE_DATE}}}</span></p>
              <p style="margin:0 0 16px 0;">Não deixe para a última hora! Enviar suas atividades no prazo é fundamental para a avaliação do seu rendimento pedagógico e emissão de relatórios.</p>
            </td>
          </tr>
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color:#b91c1c;border-radius:8px;">
                    <a href="{{{TAREFA_URL}}}" target="_blank" style="display:inline-block;padding:12px 24px;font-size:13px;color:#ffffff;text-decoration:none;font-weight:600;">Enviar Atividade Agora</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 📈 5. Novo Relatório Pedagógico Disponibilizado

**Assunto Sugerido**: `Aprova+ - Seu novo relatório pedagógico de acompanhamento está pronto!`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aprova+ - Relatório Disponível</title>
</head>
<body style="margin:0;padding:0;background-color:#fbfbfa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fbfbfa;padding:20px 0;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff;border:1px solid #eaeaea;border-radius:12px;overflow:hidden;padding:40px;">
          <tr>
            <td align="left" style="padding-bottom:20px;border-bottom:1px solid #eaeaea;">
              <span style="font-size:18px;font-weight:bold;color:#1e535c;">Aprova+ • Desempenho</span>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 0 20px 0;">
              <h2 style="font-size:18px;color:#111827;margin:0;font-weight:700;">Seu relatório pedagógico semanal foi publicado!</h2>
            </td>
          </tr>
          <tr>
            <td style="font-size:14px;line-height:22px;color:#4b5563;padding-bottom:35px;">
              <p style="margin:0 0 12px 0;">Prezados responsáveis e aluno <strong>{{{STUDENT_NAME}}}</strong>,</p>
              <p style="margin:0 0 16px 0;">Informamos que o seu relatório pedagógico detalhado correspondente ao período de <strong style="color:#111827;">{{{PERIODO}}}</strong> já está disponível para consulta no sistema.</p>
              <p style="margin:0 0 16px 0;">Nossos professores compilaram dados referentes a conteúdos ministrados, quantidade de acertos, participação nas dinâmicas de ensino e observações personalizadas de evolução.</p>
              <p style="margin:0 0 16px 0;">Para ler o relatório completo, assinar digitalmente e acompanhar as estatísticas de desempenho acadêmico, acesse a plataforma:</p>
            </td>
          </tr>
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color:#1e535c;border-radius:8px;">
                    <a href="{{{DASHBOARD_URL}}}" target="_blank" style="display:inline-block;padding:12px 24px;font-size:13px;color:#ffffff;text-decoration:none;font-weight:600;">Acessar Relatório de Evolução</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```
