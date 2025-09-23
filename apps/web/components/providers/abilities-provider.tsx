'use client';

import { createContext, useContext, ReactNode, ComponentType } from 'react';
import { createContextualCan, CanProps } from '@casl/react';
import { AppAbility, createAbilityForUser, createAbilityForGuest, User } from '../../lib/abilities';

// Create CASL context with null default
const AbilityContext = createContext<AppAbility | null>(null);

// Create the Can component with proper typing
export const Can: ComponentType<CanProps<AppAbility>> = createContextualCan(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AbilityContext.Consumer as any
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
export function useAbilities(): {
  ability: AppAbility;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Can: React.ComponentType<any>;
} {
  const ability = useContext(AbilityContext);
  if (!ability) {
    throw new Error('useAbilities must be used within an AbilitiesProvider');
  }

  // Create a contextual Can component that automatically uses the ability from context
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ContextualCan: React.ComponentType<any> = (props) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <Can ability={ability} {...(props as any)} />;
  };

  return { ability, Can: ContextualCan };
}
