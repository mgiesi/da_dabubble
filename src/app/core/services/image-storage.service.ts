import { Injectable } from '@angular/core';
import { set, get, del } from 'idb-keyval';

@Injectable({
  providedIn: 'root'
})
export class ImageStorageService {

  async saveAvatarImage(uid: string, blob: Blob): Promise<void> {
    await set(uid, blob);
  }

  async loadAvatarImage(id: string): Promise<Blob | undefined> {
    const blob = await get<Blob>(id);
    return blob ?? undefined;
  }

  async clearAvatarImage(id: string): Promise<void> {
    await del(id);
  }

  async resolveImgSrc(imgUrl?: string | null, fallbackUrl?: string): Promise<{ src: string, revoke?: () => void }> {
    if (!imgUrl) {
      return { src: fallbackUrl ?? '' };
    }

    if (imgUrl.startsWith('idb:')) {
      const key = imgUrl.slice(4);
      const blob = await this.loadAvatarImage(key);
      if (blob) {
        const objectUrl = URL.createObjectURL(blob);
        return {
          src: objectUrl,
          revoke: () => URL.revokeObjectURL(objectUrl)
        };
      }
      return { src: fallbackUrl ?? '' };
    }

    return {src: imgUrl };
  }
}
