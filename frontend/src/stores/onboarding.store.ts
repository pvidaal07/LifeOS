import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
  welcomeCardDismissed: boolean;

  // Acciones
  dismissWelcomeCard: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      welcomeCardDismissed: false,

      dismissWelcomeCard: () =>
        set({ welcomeCardDismissed: true }),

      resetOnboarding: () =>
        set({ welcomeCardDismissed: false }),
    }),
    {
      name: 'lifeos-onboarding',
      partialize: (state) => ({
        welcomeCardDismissed: state.welcomeCardDismissed,
      }),
    },
  ),
);
