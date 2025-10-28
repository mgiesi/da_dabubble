import { Injectable, inject, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChatScrollService {
  private renderer: Renderer2;

  constructor() {
    const rendererFactory = inject(RendererFactory2);
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  scrollToBottom(container: HTMLElement) {
    if (!container) return;
    this.renderer.setProperty(container, 'scrollTop', container.scrollHeight);
  }

  scrollToBottomAfterUpdate(container: HTMLElement, callback?: () => void) {
    setTimeout(() => {
      this.scrollToBottom(container);
      this.waitForImagesToLoad(container, callback);
    }, 1);
  }

  private waitForImagesToLoad(container: HTMLElement, callback?: () => void) {
    if (!container) return;

    const images = container.querySelectorAll('img');
    const totalImages = images.length;

    if (totalImages === 0) {
      callback?.();
      return;
    }

    let loadedImages = 0;

    images.forEach((img: HTMLImageElement) => {
      if (img.complete) {
        loadedImages++;
        if (loadedImages === totalImages) {
          this.scrollToBottom(container);
          callback?.();
        }
      } else {
        img.onload = () => {
          loadedImages++;
          if (loadedImages === totalImages) {
            this.scrollToBottom(container);
            callback?.();
          }
        };
      }
    });
  }
}