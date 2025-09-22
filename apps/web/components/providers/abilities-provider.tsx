'use client';

import { createContext, useContext, ReactNode, ComponentType } from 'react';
import { createContextualCan, CanProps } from '@casl/react';
import { AppAbility, createAbilityForUser, createAbilityForGuest, User } from '../../lib/abilities';

// Create CASL context
const AbilityContext = createContext<AppAbility>(createAbilityForGuest());

// Create the Can component with proper typing
export const Can: ComponentType<CanProps<AppAbility>> = createContextualCan(
  AbilityContext.Consumer
);

interface AbilitiesProviderProps {
  children: ReactNode;
  user?: User;
}

/**
 * Abilities Provider
 * Provides CASL abilities context to the entire app
 */
export function AbilitiesProvider({ children, user }: Readonly<AbilitiesProviderProps>) {
  const ability = user ? createAbilityForUser(user) : createAbilityForGuest();

  return <AbilityContext.Provider value={ability}>{children}</AbilityContext.Provider>;
}

/**
 * Hook to access abilities in components
 */
export function useAbilities(): { ability: AppAbility; Can: typeof Can } {
  const ability = useContext(AbilityContext);
  if (!ability) {
    throw new Error('useAbilities must be used within an AbilitiesProvider');
  }
  return { ability, Can };
}
