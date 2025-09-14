import { Directive, effect, ElementRef, HostListener, inject, Injector, Input, OnDestroy } from "@angular/core";
import { useResolvedImage } from "./img-src-util.service";

@Directive({
    selector: 'img[resolvedImg]',
    standalone: true
})
export class ImgSrcDirective implements OnDestroy {
    // Holds the current desired image identifier/URL. Can be 'null' to force fallback.
    private _resolvedImg: string | null = null;
    private _fallback = 'img/avatar/unknown-image.png';

    private injector = inject(Injector);
    private img = useResolvedImage(this._fallback);

    /**
     * The desired image to display. This can be a URL (http://xxx, img/xxx) or a link to the
     * indexDB (idb:xxx). 
     */
    @Input() 
    set resolvedImg(value: string | null) {
        this._resolvedImg = value;
        this.img.load(this._resolvedImg, this._fallback);
    }
    get resolvedImg() {
        return this._resolvedImg;
    }

    /**
     * Fallback image url to show while loading the image or on errors.
     */
    @Input() 
    set fallback(value: string) {
        this._fallback = value || 'img/avatar/unknown-image.png';
        this.img.load(this._resolvedImg, this._fallback);
    }
    get fallback() {
        return this._fallback;
    }
    
    /**
     * Binds the resolved source to the host <img> element via an Angular Signal effect.
     * Also seeds the initial 'src' with the fallback.
     */
    constructor(private el: ElementRef<HTMLImageElement>) {
        effect(() => {
            this.el.nativeElement.src = this.img.imgSrc();
        }, { injector: this.injector });

        this.el.nativeElement.src = this._fallback;
    }
    
    /**
     * Host error handler for the <img> element. Switches back to the current fallback
     * and revokes any active object URL to prevent leaks.
     *
     * Wire-up is automatic via @HostListener.
     */
    @HostListener('error') 
    onError() {
        this.img.onError();
    }

    /**
     * Lifecycle cleanup. Revokes any active object URL created during image resolution.
     * Always called when the directive is destroyed.
     */
    ngOnDestroy(): void {
        this.img.destroy();
    }    
}