export type TicketStatus =
  | 'BACKLOG'
  | 'IN_PROGRESS'
  | 'READY_FOR_REVIEW'
  | 'APPROVED'
  | 'REWORK';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface AttachmentItem {
  id: string;
  ticketId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  createdAt: string | Date;
}

export interface ActivityLogItem {
  id: string;
  ticketId: string;
  action: string;
  actor: string;
  details?: string | null;
  createdAt: string | Date;
}

export interface TicketItem {
  id: string;
  ticketNumber: number;
  title: string;
  description: string;
  priority: Priority;
  status: TicketStatus;
  stagingUrl?: string | null;
  releaseNote?: string | null;
  reviewToken: string;
  readyAt?: string | Date | null;
  reviewedAt?: string | Date | null;
  reviewerName?: string | null;
  reviewerPicture?: string | null;
  reviewerLineId?: string | null;
  rejectionReason?: string | null;
  createdBy: string;
  attachments?: AttachmentItem[];
  activities?: ActivityLogItem[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface SystemSettingsData {
  projectName: string;
  defaultStagingUrl?: string;
  lineChannelToken?: string;
  lineGroupId?: string;
  liffId?: string;
  adminPasscode?: string;
}
