export interface TicketNote {
  id: string;
  author: string;
  authorRole?: 'staff' | 'client' | string;
  note: string;
  createdAt?: string;
  created_at?: string;
  visibility?: 'internal' | 'client' | 'public';
}

export interface Ticket {
  id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  attachments?: any[];
  internalNotes?: TicketNote[];
  clientComplaints?: TicketNote[];
  created_at?: string;
}
