export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  MANAGER = 'manager',
  SUPERVISOR = 'supervisor',
  CONTRACTOR = 'contractor',
  CLIENT = 'client',
}

export enum ServiceStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  NEEDS_REVIEW = 'needs_review',
  CANCELLED = 'cancelled',
}

export enum AssignmentStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  PENDING_VERIFICATION = 'pending_verification',
  COMPLETED = 'completed',
  RETURNED = 'returned',
  CANCELLED = 'cancelled',
}

export enum ChecklistItemStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  NA = 'na',
}

export enum PhotoCategory {
  BEFORE = 'before',
  AFTER = 'after',
  CHECKLIST = 'checklist',
}

export enum PhotoStatus {
  PENDING = 'pending',
  UPLOADING = 'uploading',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum NotificationType {
  SERVICE_STARTED = 'service_started',
  SERVICE_PENDING_VERIFICATION = 'service_pending_verification',
  SERVICE_RETURNED = 'service_returned',
  SERVICE_COMPLETED = 'service_completed',
  SERVICE_CANCELLED = 'service_cancelled',
  SERVICE_NEEDS_REVIEW = 'service_needs_review',
  SERVICE_ASSIGNED = 'service_assigned',
  CHECKLIST_RETURNED = 'checklist_returned',
  INCIDENT_REPORTED = 'incident_reported',
  TIME_APPROVED = 'time_approved',
  TIME_REJECTED = 'time_rejected',
  ON_THE_WAY = 'on_the_way',
  REMINDER_24H = 'reminder_24h',
  REMINDER_2H = 'reminder_2h',
  STOCK_ALERT = 'stock_alert',
  LOCATION_ALERT = 'location_alert',
  CLEANER_DEACTIVATED_WITH_ACTIVE_SERVICE = 'cleaner_deactivated_with_active_service',
  SYSTEM = 'system',
}

export enum SyncAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

export enum SyncEntity {
  SERVICE = 'service',
  ASSIGNMENT = 'assignment',
  CHECKLIST_ITEM = 'checklist_item',
  PHOTO = 'photo',
  LOCATION_LOG = 'location_log',
}

export enum SyncStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ReportType {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
}

export enum ContractType {
  W2 = 'w2',
  CONTRACTOR_1099 = 'contractor_1099',
}

export enum DocumentCategory {
  CONTRACT = 'contract',
  ID = 'id',
  CERTIFICATION = 'certification',
  OTHER = 'other',
}

export enum RecurrenceFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
}

export enum ServiceTypeCategory {
  RESIDENTIAL_STANDARD = 'residential_standard',
  COMMERCIAL_JANITORIAL = 'commercial_janitorial',
  DEEP_CLEANING = 'deep_cleaning',
  MOVE_IN = 'move_in',
  MOVE_OUT = 'move_out',
  RECURRING = 'recurring',
  ONE_TIME = 'one_time',
}

export enum ScorePeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
}

export const LATE_THRESHOLD_MINUTES_DEFAULT = 15;
