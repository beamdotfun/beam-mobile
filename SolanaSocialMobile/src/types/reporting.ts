export interface ContentReport {
  id: string;
  reporterWallet: string;
  reportedContentId: string;
  reportedContentType: 'post' | 'profile';
  reportedUserWallet: string;

  // Report details
  reason: ReportReason;
  description: string;

  // Blockchain transaction
  transactionSignature?: string;

  // Status
  status: 'pending' | 'submitted' | 'failed';

  // Metadata
  createdAt: string;
  submittedAt?: string;
}

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'violence'
  | 'inappropriate_content'
  | 'misinformation'
  | 'copyright'
  | 'fraud'
  | 'impersonation'
  | 'other';

export interface ReportOption {
  value: ReportReason;
  label: string;
  description: string;
}

export interface ReportSubmission {
  contentId: string;
  contentType: 'post' | 'profile';
  reportedUserWallet: string;
  reason: ReportReason;
  description: string;
}
