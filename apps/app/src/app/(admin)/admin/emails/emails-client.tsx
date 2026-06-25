"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ChevronRight,
  Download,
  Inbox,
  Mail,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  sendEmailAction,
  getAttachmentDownloadUrlAction,
  type EmailWithAttachments,
} from "@/lib/actions/emails";

interface EmailsClientProps {
  initialEmails: EmailWithAttachments[];
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatBytes(bytes: number | null) {
  if (bytes === null) return "N/A";
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function EmailsClient({ initialEmails }: EmailsClientProps) {
  const router = useRouter();
  const [emails, setEmails] = useState<EmailWithAttachments[]>(initialEmails);
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [searchQuery, setSearchQuery] = useState("");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] =
    useState<EmailWithAttachments | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync client state with server component prop updates
  useEffect(() => {
    setEmails(initialEmails);
  }, [initialEmails]);

  // Form states
  const [formData, setFormData] = useState({
    from: "contato",
    to: "",
    subject: "",
    html: "",
    replyTo: "",
  });

  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<
    string | null
  >(null);

  // Filter and search emails
  const filteredEmails = emails.filter((email) => {
    if (email.direction !== activeTab) return false;

    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const fromMatches = email.from_email.toLowerCase().includes(query);
    const toMatches = email.to_emails.some((t) =>
      t.toLowerCase().includes(query),
    );
    const subjectMatches =
      email.subject?.toLowerCase().includes(query) ?? false;
    const bodyMatches =
      (email.body_text?.toLowerCase().includes(query) ?? false) ||
      (email.body_html?.toLowerCase().includes(query) ?? false);

    return fromMatches || toMatches || subjectMatches || bodyMatches;
  });

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.to) {
      toast.error("Informe pelo menos um destinatário.");
      return;
    }
    if (!formData.subject) {
      toast.error("Informe o assunto.");
      return;
    }
    if (!formData.html) {
      toast.error("Escreva a mensagem.");
      return;
    }

    const fromAddress = `${formData.from.trim()}@aprovamaiscurso-pro.com.br`;

    startTransition(async () => {
      const res = await sendEmailAction({
        from: fromAddress,
        to: formData.to,
        subject: formData.subject,
        html: formData.html,
        replyTo: formData.replyTo || undefined,
      });

      if (res.ok) {
        toast.success("E-mail enviado com sucesso!");
        setIsComposeOpen(false);
        setFormData({
          from: "contato",
          to: "",
          subject: "",
          html: "",
          replyTo: "",
        });
        setActiveTab("sent");
        router.refresh();
      } else {
        toast.error(`Erro ao enviar e-mail: ${res.error}`);
      }
    });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    startTransition(() => {
      router.refresh();
      setTimeout(() => {
        setIsRefreshing(false);
        toast.success("Lista de e-mails atualizada!");
      }, 500);
    });
  };

  const handleDownloadAttachment = async (
    storagePath: string,
    filename: string,
    id: string,
  ) => {
    setDownloadingAttachmentId(id);
    try {
      const signedUrl = await getAttachmentDownloadUrlAction(storagePath);
      if (!signedUrl) {
        toast.error("Não foi possível gerar o link de download.");
        return;
      }

      // Create a temporary link and trigger download
      const link = document.createElement("a");
      link.href = signedUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Download de ${filename} iniciado.`);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao realizar o download.");
    } finally {
      setDownloadingAttachmentId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* List and Navigation */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Tabs
            value={activeTab}
            onValueChange={(val) => {
              setActiveTab(val as any);
              setSelectedEmail(null);
            }}
            className="w-full sm:w-auto"
          >
            <TabsList>
              <TabsTrigger
                value="received"
                className="flex items-center gap-1.5"
              >
                <Inbox className="h-3.5 w-3.5" />
                Recebidos
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5" />
                Enviados
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing || isPending}
              title="Sincronizar novos e-mails"
              className="shrink-0"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </Button>

            <Button onClick={() => setIsComposeOpen(true)} className="shrink-0">
              <Plus className="mr-2 h-4 w-4" />
              Novo E-mail
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por remetente, destinatário, assunto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            {filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <Mail className="h-10 w-10 stroke-1 mb-2 opacity-50" />
                <p className="text-sm font-medium">Nenhum e-mail encontrado</p>
                <p className="text-xs">
                  {activeTab === "received"
                    ? "Os e-mails recebidos através do seu webhook da Resend aparecerão aqui."
                    : "Os e-mails enviados através deste painel aparecerão aqui."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {activeTab === "received" ? "Remetente" : "Destinatário"}
                    </TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead className="w-30">Data</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmails.map((email) => {
                    const isSelected = selectedEmail?.id === email.id;
                    return (
                      <TableRow
                        key={email.id}
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                          isSelected ? "bg-muted" : ""
                        }`}
                        onClick={() => setSelectedEmail(email)}
                      >
                        <TableCell className="font-medium max-w-50 truncate">
                          {activeTab === "received"
                            ? email.from_email
                            : email.to_emails.join(", ")}
                        </TableCell>
                        <TableCell className="max-w-75 truncate">
                          <div className="flex items-center gap-2">
                            {email.email_attachments?.length > 0 && (
                              <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            )}
                            <span className="truncate">
                              {email.subject || "(Sem Assunto)"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {dateFormatter.format(new Date(email.created_at))}
                        </TableCell>
                        <TableCell className="text-right">
                          <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details View */}
      <div className="lg:col-span-1">
        {selectedEmail ? (
          <Card className="h-full sticky top-6">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-base line-clamp-2">
                    {selectedEmail.subject || "(Sem Assunto)"}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <Calendar className="h-3 w-3" />
                    {dateFormatter.format(new Date(selectedEmail.created_at))}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    selectedEmail.direction === "received"
                      ? "secondary"
                      : "default"
                  }
                >
                  {selectedEmail.direction === "received"
                    ? "Recebido"
                    : "Enviado"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Metadata */}
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex gap-2">
                  <span className="font-medium text-foreground w-12 shrink-0">
                    De:
                  </span>
                  <span className="truncate">{selectedEmail.from_email}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium text-foreground w-12 shrink-0">
                    Para:
                  </span>
                  <span className="truncate">
                    {selectedEmail.to_emails.join(", ")}
                  </span>
                </div>
                {selectedEmail.cc_emails &&
                  selectedEmail.cc_emails.length > 0 && (
                    <div className="flex gap-2">
                      <span className="font-medium text-foreground w-12 shrink-0">
                        Cc:
                      </span>
                      <span className="truncate">
                        {selectedEmail.cc_emails.join(", ")}
                      </span>
                    </div>
                  )}
              </div>

              {/* Body */}
              <div className="space-y-2">
                <span className="text-sm font-medium text-foreground">
                  Mensagem:
                </span>
                {selectedEmail.body_html ? (
                  <iframe
                    srcDoc={selectedEmail.body_html}
                    className="w-full h-100 border rounded-lg bg-white"
                    sandbox="allow-popups"
                    title="Conteúdo do E-mail"
                  />
                ) : (
                  <div className="p-4 bg-muted/30 rounded-lg text-sm border whitespace-pre-wrap font-sans min-h-37.5 max-h-100 overflow-y-auto">
                    {selectedEmail.body_text || "(E-mail vazio)"}
                  </div>
                )}
              </div>

              {/* Attachments */}
              {selectedEmail.email_attachments &&
                selectedEmail.email_attachments.length > 0 && (
                  <div className="space-y-2 border-t pt-4">
                    <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <Paperclip className="h-4 w-4" />
                      Anexos ({selectedEmail.email_attachments.length})
                    </span>
                    <div className="space-y-1.5">
                      {selectedEmail.email_attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border text-xs gap-4"
                        >
                          <div className="truncate">
                            <p className="font-medium truncate">
                              {att.filename}
                            </p>
                            <p className="text-muted-foreground text-[10px]">
                              {formatBytes(att.size)}
                            </p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 shrink-0"
                            onClick={() =>
                              handleDownloadAttachment(
                                att.storage_path,
                                att.filename,
                                att.id,
                              )
                            }
                            disabled={downloadingAttachmentId === att.id}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full border-dashed flex flex-col items-center justify-center p-12 text-center text-muted-foreground min-h-75">
            <Mail className="h-8 w-8 stroke-1 mb-2 opacity-40" />
            <p className="text-sm font-medium">Nenhum e-mail selecionado</p>
            <p className="text-xs max-w-50">
              Selecione um e-mail na lista ao lado para ver seus detalhes.
            </p>
          </Card>
        )}
      </div>

      {/* Compose Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-150">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Escrever E-mail
            </DialogTitle>
            <DialogDescription>
              Envie um e-mail usando seu domínio verificado da Resend.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendEmail} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="from">Remetente</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="from"
                  placeholder="contato"
                  value={formData.from}
                  onChange={(e) =>
                    setFormData({ ...formData, from: e.target.value })
                  }
                  className="text-right font-medium"
                />
                <span className="text-sm font-medium text-muted-foreground shrink-0">
                  @aprovamaiscurso-pro.com.br
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="to">Destinatário (Para)</Label>
              <Input
                id="to"
                placeholder="exemplo@dominio.com"
                value={formData.to}
                onChange={(e) =>
                  setFormData({ ...formData, to: e.target.value })
                }
              />
              <p className="text-[10px] text-muted-foreground">
                Para múltiplos destinatários, separe-os por vírgula.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subject">Assunto</Label>
              <Input
                id="subject"
                placeholder="Assunto da mensagem"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="replyTo">
                Responder Para (Reply-To){" "}
                <span className="text-muted-foreground font-normal">
                  (Opcional)
                </span>
              </Label>
              <Input
                id="replyTo"
                placeholder="seu-email-pessoal@gmail.com"
                value={formData.replyTo}
                onChange={(e) =>
                  setFormData({ ...formData, replyTo: e.target.value })
                }
              />
              <p className="text-[10px] text-muted-foreground">
                Caso deseje receber as respostas deste e-mail em outro endereço
                (ex: seu e-mail pessoal ou comercial).
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="html">Conteúdo do E-mail (HTML ou Texto)</Label>
              <Textarea
                id="html"
                placeholder="<h1>Olá!</h1><p>Esta é uma mensagem enviada do sistema Aprova+.</p>"
                value={formData.html}
                onChange={(e) =>
                  setFormData({ ...formData, html: e.target.value })
                }
                className="font-mono text-xs h-50"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsComposeOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                <Send className="mr-2 h-4 w-4" />
                {isPending ? "Enviando..." : "Enviar E-mail"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
