import { describe, expect, it, beforeEach } from 'vitest';
import { useOnboardingStore } from './onboarding.store';

describe('onboarding.store', () => {
  beforeEach(() => {
    // Reset store state between tests
    useOnboardingStore.getState().resetOnboarding();
  });

  it('initializes with welcomeCardDismissed as false', () => {
    const state = useOnboardingStore.getState();
    expect(state.welcomeCardDismissed).toBe(false);
  });

  it('sets welcomeCardDismissed to true when dismissWelcomeCard is called', () => {
    useOnboardingStore.getState().dismissWelcomeCard();

    expect(useOnboardingStore.getState().welcomeCardDismissed).toBe(true);
  });

  it('resets welcomeCardDismissed to false when resetOnboarding is called', () => {
    useOnboardingStore.getState().dismissWelcomeCard();
    expect(useOnboardingStore.getState().welcomeCardDismissed).toBe(true);

    useOnboardingStore.getState().resetOnboarding();
    expect(useOnboardingStore.getState().welcomeCardDismissed).toBe(false);
  });

  it('persists state under the "lifeos-onboarding" key', () => {
    // The persist middleware uses the name 'lifeos-onboarding'
    // We can verify this by checking that the store has persist API
    const store = useOnboardingStore;
    expect(store.persist).toBeDefined();
    expect(store.persist.getOptions().name).toBe('lifeos-onboarding');
  });
});
