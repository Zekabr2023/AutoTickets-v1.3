export enum TicketStatus {
  Pending = 'Pending',
  InAnalysis = 'InAnalysis',
  Resolved = 'Resolved',
}

export enum UrgencyLevel {
  Low = 'Baixa',
  Medium = 'Média',
  High = 'Alta',
  Critical = 'Crítica',
}

export interface AI {
  id: string;
  name: string;
}

export interface Ticket {
  id: string;
  numero: number;
  title: string;
  description: string;
  whatShouldHappen: string;
  aiId: string;
  aiName: string;
  status: TicketStatus;
  createdAt: string;
  attachments: { name: string; url: string }[];
  urgency: UrgencyLevel;
  solucao?: string;
  resolvidoPor?: string;
  resolvidoEm?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}
