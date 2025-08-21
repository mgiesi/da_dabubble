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
export interface User {
    /**
     * Firestore document ID (optional).
     * Not part of the stored fields unless you copy it into the document.
     */
    id?: string;

    /**
     * Firebase Authentication UID identifying the user across services.
     */
    uid: string;

    /**
     * Human-readable display name shown in the UI.
     */
    displayName: string;

    /**
     * Primary email address associated with the account.
     */
    email: string;

    /**
     * Absolute URL to the user's avatar/profile image.
     */
    imgUrl: string;

    /**
     * Simple presence flag for the user.
     * Consider updating via presence logic or Cloud Functions.
     */
    status: "online" | "offline";

    /**
     * Creation timestamp for the user document.
     * Usually set to `serverTimestamp()` when the document is first written.
     */
    createdAt: Timestamp;

    /**
     * Timestamp of the user's most recent activity/heartbeat.
     * Update on sign-in, tab focus, or periodic presence pings.
     */
    lastSeenAt: Timestamp;
}