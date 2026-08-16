import { z } from "zod";
import { calculateAge, isValidCPF, onlyDigits } from "@/lib/evento/format";

export const serieAtualValues = [
  "1_ano",
  "2_ano",
  "3_ano",
  "concluido",
] as const;

export const inscricaoSchema = z
  .object({
    nomeAluno: z.string().trim().min(5, "Informe o nome completo do aluno."),
    emailAluno: z
      .string()
      .trim()
      .toLowerCase()
      .email("Informe um e-mail válido — é para lá que o ingresso vai."),
    whatsappAluno: z
      .string()
      .trim()
      .refine(
        (value) => onlyDigits(value).length >= 10,
        "Informe um WhatsApp válido com DDD.",
      ),
    cpfAluno: z
      .string()
      .trim()
      .refine((value) => isValidCPF(value), "Informe um CPF válido."),
    dataNascimento: z
      .string()
      .trim()
      .refine((value) => {
        const age = calculateAge(value);
        return age !== null && age >= 10 && age <= 100;
      }, "Informe uma data de nascimento válida."),
    serieAtual: z.enum(serieAtualValues, {
      message: "Selecione a série atual do aluno.",
    }),
    nomeResponsavel: z.string().trim().optional().default(""),
    whatsappResponsavel: z.string().trim().optional().default(""),
    restricoesMedicas: z.string().trim().optional().default(""),
    utmSource: z.string().trim().optional().default(""),
    utmMedium: z.string().trim().optional().default(""),
    utmCampaign: z.string().trim().optional().default(""),
  })
  .superRefine((values, ctx) => {
    const age = calculateAge(values.dataNascimento);
    if (age !== null && age < 18) {
      if (values.nomeResponsavel.length < 5) {
        ctx.addIssue({
          code: "custom",
          message: "Nome do responsável é obrigatório para menores de idade.",
          path: ["nomeResponsavel"],
        });
      }
      if (onlyDigits(values.whatsappResponsavel).length < 10) {
        ctx.addIssue({
          code: "custom",
          message:
            "WhatsApp do responsável é obrigatório para menores de idade.",
          path: ["whatsappResponsavel"],
        });
      }
    }
  });

export type InscricaoFormValues = z.infer<typeof inscricaoSchema>;
