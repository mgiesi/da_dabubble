import { inject, signal } from '@angular/core';
import { ImageStorageService } from './image-storage.service';

/**
 * Small Angular "hook"-like utility built with Signals to resolve image URLs from indexDB storage.
 * Just call load(url) where url can be a typical url (https://, img/) or a string starting with idb:
 * 
 * Why the revoke function?
 * Resolving a idb: link return temporary object URLs via URL.createObjectURL(blob)).
 * These must be revoked (URL.revokeObjectURL) once you no longer need them to avoid memory leaks.
 * The returned `revoke()` callback encapsulates that cleanup.
 */
export function useResolvedImage(initialFallback = 'img/avatar/unknown-image.png') {
    // Service to load image from the indexDB
    const imgStorage = inject(ImageStorageService);
    // Reactive holder for the current <img [src]> value
    const imgSrc = signal<string>(initialFallback);
    // Holds the revoke function for the current src
    let revokeFn: (() => void) | undefined;
    // Helper number to prevent race conditions between overlapping load calls
    let requestSeq = 0;
    // Fallback url
    let currentFallback = initialFallback;

    /**
     * Resolve the url and set the image source.
     * 
     * @param imgUrl url (https://, img/..., idb:...)
     * @param fallback optional fallback url
     */
    async function load(imgUrl: string | null | undefined, fallback = initialFallback) {
        currentFallback = fallback;
        const myId = ++requestSeq;
        // Revoke any previously allocated object URL before starting a new load
        if (revokeFn) {
            revokeFn();
            revokeFn = undefined;
        }

        imgSrc.set(fallback);
        const { src, revoke } = await imgStorage.resolveImgSrc(imgUrl ?? '', fallback);
        if (myId !== requestSeq) {
            if (revoke) revoke();
            return;
        }

        imgSrc.set(src || fallback);
        revokeFn = revoke;
    }

    /**
     * To be called rom <img (error)>.
     */
    function onError() {
        if (revokeFn) {
            revokeFn();
            revokeFn = undefined;
        }
        imgSrc.set(currentFallback);
    }

    /**
     * Cleanup hook. Call in ngOnDestroy of the consuming component or directive!!
     */
    function destroy() {
        if (revokeFn) {
            revokeFn();
            revokeFn = undefined;
        }
    }

    return { imgSrc, load, onError, destroy };
}