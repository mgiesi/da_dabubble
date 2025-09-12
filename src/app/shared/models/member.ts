import { Timestamp } from "@angular/fire/firestore";

/**
 * Domain model for an application user stored in Firestore.
 *
 * Notes:
 * - `Timestamp` is the Firestore timestamp type (from `@angular/fire/firestore`).
 * - `id` is typically the Firestore document ID; `uid` is the Firebase Auth user ID.
 * - `createdAt` should be set once when the user document is created.
 * - `lastSeenAt` can be updated to track presence/last activity.
 */
export interface Member {
    id: string;

    joinedAt: Timestamp;
}