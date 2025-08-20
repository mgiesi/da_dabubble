import { Timestamp } from "@angular/fire/firestore";

/**
 * Represents a communication channel in the application.
 *
 * A channel is a space where users can exchange messages.
 * Each channel has a name, an owner, an optional description,
 * and metadata about its creation and last update.
 */
export interface Channel {
    /**
     * Unique identifier of the channel document in Firestore.
     * This field is typically injected via `collectionData(..., { idField: 'id' })`.
     */
    id?: string;

    /**
     * Human-readable name of the channel.
     * Used for display and ordering.
     */
    name: string;

    /**
     * Optional description providing more details about the channel's purpose.
     */
    description?: string;

    /**
     * The ID of the user who created/owns the channel.
     */
    ownerId: string;

    /**
     * Timestamp when the channel was created.
     * Populated automatically by Firestore using `serverTimestamp()`.
     */
    createdAt: Timestamp; // Could be Firestore Timestamp type if you prefer

    /**
     * Timestamp when the channel was last updated.
     * Also populated automatically by Firestore.
     */
    updatedAt: Timestamp;
}