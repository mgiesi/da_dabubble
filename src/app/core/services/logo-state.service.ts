import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LogoStateService {
  private currentViewSignal = signal<'workspace' | 'chat' | 'thread'>(
    'workspace'
  );
  private isMobileSignal = signal<boolean>(false);
  private currentChannelNameSignal = signal<string>('');
  private workspaceNameSignal = signal<string>('Devspace');

  readonly shouldShowWorkspaceLogo = computed(() => {
    const isMobile = this.isMobileSignal();
    const currentView = this.currentViewSignal();

    // Only on mobile (under 768px) and in chat/thread view
    return isMobile && (currentView === 'chat' || currentView === 'thread');
  });

  readonly logoSrc = computed(() => {
    return this.shouldShowWorkspaceLogo()
      ? 'icons/workspace-logo.svg'
      : 'img/logo/DABubble-logo.png';
  });

  readonly headerTitle = computed(() => {
    return this.shouldShowWorkspaceLogo()
      ? this.currentChannelNameSignal()
      : 'DABubble';
  });

  readonly showBackArrow = computed(() => {
    return this.shouldShowWorkspaceLogo();
  });

  readonly isWorkspaceView = computed(
    () => this.currentViewSignal() === 'workspace'
  );
  readonly isChatView = computed(() => this.currentViewSignal() === 'chat');
  readonly isThreadView = computed(() => this.currentViewSignal() === 'thread');
  readonly isMobile = computed(() => this.isMobileSignal());

  constructor() {
    this.checkScreenSize();
    this.setupResizeListener();
  }

  setCurrentView(view: 'workspace' | 'chat' | 'thread') {
    this.currentViewSignal.set(view);
  }

  setCurrentChannelName(name: string) {
    this.currentChannelNameSignal.set(name);
  }

  setWorkspaceName(name: string) {
    this.workspaceNameSignal.set(name);
  }

  private checkScreenSize() {
    this.isMobileSignal.set(window.innerWidth < 768);
  }

  private setupResizeListener() {
    window.addEventListener('resize', () => {
      this.checkScreenSize();
    });
  }
}
