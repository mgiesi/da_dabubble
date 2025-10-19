import { Injectable, signal, computed } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LogoStateService {
  private currentViewSignal = signal<'workspace' | 'chat' | 'thread'>('workspace');
  private isMobileSignal = signal<boolean>(false);
  private currentChannelNameSignal = signal<string>('');
  private workspaceNameSignal = signal<string>('Devspace');
  private backToWorkspace$ = new Subject<void>();
  private isReturningFromBackButtonSignal = signal<boolean>(false);
  
  readonly backToWorkspace = this.backToWorkspace$.asObservable();
  readonly isReturningFromBackButton = computed(() => this.isReturningFromBackButtonSignal());

  readonly shouldShowWorkspaceLogo = computed(() => {
    const isMobile = this.isMobileSignal();
    const currentView = this.currentViewSignal();
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

  readonly isWorkspaceView = computed(() => this.currentViewSignal() === 'workspace');
  readonly isChatView = computed(() => this.currentViewSignal() === 'chat');
  readonly isThreadView = computed(() => this.currentViewSignal() === 'thread');
  readonly isMobile = computed(() => this.isMobileSignal());

  constructor() {
    this.checkScreenSize();
    this.setupResizeListener();
  }

  setCurrentView(view: 'workspace' | 'chat' | 'thread') {
    this.currentViewSignal.set(view);
    
    if (view === 'chat') {
      this.isReturningFromBackButtonSignal.set(false);
    }
  }

  setCurrentChannelName(name: string) {
    this.currentChannelNameSignal.set(name);
  }

  setWorkspaceName(name: string) {
    this.workspaceNameSignal.set(name);
  }

  triggerBackToWorkspace() {
    this.isReturningFromBackButtonSignal.set(true);
    this.backToWorkspace$.next();
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