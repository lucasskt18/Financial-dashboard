export type Kind = "entrada" | "saida" | "economia" | "investimento";

export type Flow = "normal" | "resgate";

export type Movement = {
  id: string;
  date: string;
  kind: Kind;
  flow: Flow;
  amountCents: number;
  category: string;
  description: string;
  createdAt: string;
};

export const KIND_LABEL: Record<Kind, string> = {
  entrada: "Entrada",
  saida: "Débito",
  economia: "Economia",
  investimento: "Investimento",
};

export const CATEGORIES: Record<Kind, string[]> = {
  saida: [
    "Alimentação",
    "Mercado",
    "Transporte",
    "Moradia",
    "Contas",
    "Saúde",
    "Lazer",
    "Educação",
    "Outros",
  ],
  entrada: ["Salário", "Freelance", "Reembolso", "Outros"],
  economia: ["Reserva", "Meta", "Outros"],
  investimento: ["Renda fixa", "Ações", "Fundos", "Cripto", "Previdência", "Outros"],
};
