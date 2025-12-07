export enum TicketStatus {
  Pending = 'Pending',
  InAnalysis = 'InAnalysis',
  Resolved = 'Resolved',
  AwaitingInfo = 'AwaitingInfo',
  Archived = 'Archived',
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
  empresaNome?: string;
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
  solicitacaoInfo?: string; // Pergunta do admin
  respostaCliente?: string; // Resposta do cliente
  attachmentsSolution?: { name: string; url: string }[];
  aguardandoInfoDesde?: string; // Timestamp para aceitação tácita (48h)
  chatHistory: {
    sender: 'Admin' | 'Client';
    message: string;
    timestamp: string;
  }[];
  solicitanteNome?: string; // Nome de quem abriu o ticket
}

export interface User {
  id: string;
  name: string;
  email: string;
}
