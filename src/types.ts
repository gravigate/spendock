export interface Transaction {
  id: string;
  name: string;
  amount: number;
  date: string;
  type: 'incoming' | 'outgoing';
  recurring: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  isException?: boolean;
  parentId?: string;
  isHidden?: boolean;
  endDate?: string;
}
