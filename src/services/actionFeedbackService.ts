/**
 * Action Feedback Service
 * Dispatches lightweight section/action loading indicators & celebratory completion animations
 */

import { audioFeedback } from './audioFeedbackService';

export interface LoadingState {
  isLoading: boolean;
  title: string;
  subtitle?: string;
  facilityId?: string;
}

export interface SuccessFeedbackData {
  title: string;
  subtitle: string;
  facilityName?: string;
  facilityId?: string;
  referenceCode?: string;
  details?: { label: string; value: string }[];
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

type LoadingListener = (state: LoadingState) => void;
type SuccessListener = (data: SuccessFeedbackData | null) => void;

class ActionFeedbackManager {
  private loadingListeners: Set<LoadingListener> = new Set();
  private successListeners: Set<SuccessListener> = new Set();
  private loadingTimeout: any = null;

  public subscribeLoading(fn: LoadingListener): () => void {
    this.loadingListeners.add(fn);
    return () => this.loadingListeners.delete(fn);
  }

  public subscribeSuccess(fn: SuccessListener): () => void {
    this.successListeners.add(fn);
    return () => this.successListeners.delete(fn);
  }

  /**
   * Show a lightweight loading screen when clicking any section or card
   * Defaults to a quick ~380ms high-class visual transition
   */
  public startLoading(title: string = 'Loading...', subtitle?: string, facilityId?: string, minDurationMs: number = 380): Promise<void> {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }

    audioFeedback.playTransition();

    const state: LoadingState = {
      isLoading: true,
      title,
      subtitle,
      facilityId,
    };

    this.loadingListeners.forEach((fn) => fn(state));

    return new Promise((resolve) => {
      this.loadingTimeout = setTimeout(() => {
        this.stopLoading();
        resolve();
      }, minDurationMs);
    });
  }

  public stopLoading() {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }
    const state: LoadingState = {
      isLoading: false,
      title: '',
    };
    this.loadingListeners.forEach((fn) => fn(state));
  }

  /**
   * Show an animated celebratory completion screen after any action (e.g. reservation, update, sync)
   */
  public showSuccess(data: SuccessFeedbackData) {
    audioFeedback.playSuccessChime();

    // Trigger haptic vibration on supporting mobile devices
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([40, 60, 80]);
      } catch (e) {}
    }

    this.successListeners.forEach((fn) => fn(data));
  }

  public dismissSuccess() {
    this.successListeners.forEach((fn) => fn(null));
  }
}

export const ActionFeedback = new ActionFeedbackManager();
