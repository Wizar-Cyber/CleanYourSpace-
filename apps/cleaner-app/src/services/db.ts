import Dexie, { type Table } from 'dexie';

export interface OfflineAssignment {
  id: string;
  serviceId: string;
  cleanerId: string;
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  status: string;
  notes?: string;
  serviceName?: string;
  clientName: string;
  clientAddress: string;
  timerStart?: string;
  timerEnd?: string;
  totalMinutes?: number;
  synced: boolean;
  updatedAt: string;
}

export interface OfflineChecklistItem {
  id: string;
  assignmentId: string;
  templateItemId: string;
  label: string;
  status: string;
  notes?: string;
  synced: boolean;
  updatedAt: string;
}

export interface OfflinePhoto {
  id: string;
  assignmentId: string;
  serviceId?: string;
  checklistItemId?: string;
  category: string;
  type: string;
  filename: string;
  data: string;
  mimeType: string;
  size: number;
  fileSizeKb?: number;
  filePath?: string;
  takenAt?: string;
  isSynced: boolean;
  synced: boolean;
  createdAt: string;
}

export interface SyncQueueItem {
  id?: number;
  entity: string;
  entityId: string;
  action: string;
  payload: unknown;
  timestamp: number;
  retryCount: number;
}

class CoreconDB extends Dexie {
  assignments!: Table<OfflineAssignment, string>;
  checklistItems!: Table<OfflineChecklistItem, string>;
  photos!: Table<OfflinePhoto, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('corecon-cleaner');

    this.version(3).stores({
      assignments: 'id, status, scheduledDate, synced',
      checklistItems: 'id, assignmentId, status, synced',
      photos: 'id, assignmentId, category, synced',
      syncQueue: '++id, entity, entityId, timestamp',
    });
  }
}

export const db = new CoreconDB();

export async function saveAssignmentOffline(assignment: OfflineAssignment) {
  await db.assignments.put({ ...assignment, synced: true, updatedAt: new Date().toISOString() });
}

export async function getOfflineAssignments() {
  return db.assignments.orderBy('scheduledDate').reverse().toArray();
}

export async function saveChecklistItemOffline(item: OfflineChecklistItem) {
  await db.checklistItems.put({ ...item, synced: false, updatedAt: new Date().toISOString() });
  await addToSyncQueue('checklist_item', item.id, 'update', item);
}

export async function getOfflineChecklist(assignmentId: string) {
  return db.checklistItems.where({ assignmentId }).toArray();
}

export async function savePhotoOffline(photo: OfflinePhoto) {
  await db.photos.put(photo);
  await addToSyncQueue('photo', photo.id, 'create', photo);
}

export async function getOfflinePhotos(assignmentId: string) {
  return db.photos.where({ assignmentId }).toArray();
}

export async function addToSyncQueue(
  entity: string,
  entityId: string,
  action: string,
  payload: unknown,
) {
  await db.syncQueue.add({
    entity,
    entityId,
    action,
    payload,
    timestamp: Date.now(),
    retryCount: 0,
  });
}

export async function getPendingSyncCount(): Promise<number> {
  return db.syncQueue.count();
}

export async function getSyncQueue() {
  return db.syncQueue.orderBy('timestamp').toArray();
}

export async function clearSyncedItem(id: number) {
  await db.syncQueue.delete(id);
}
