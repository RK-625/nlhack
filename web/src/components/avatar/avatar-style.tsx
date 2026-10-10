// Modified from rakazo (Apache-2.0), github.com/elie222/rakazo@912c977
import { createContext, type ReactNode, useContext } from "react";

export type AvatarStyle = "robot" | "organic";

const AvatarStyleContext = createContext<AvatarStyle>("robot");

export function AvatarStyleProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: AvatarStyle;
}) {
  return <AvatarStyleContext value={value}>{children}</AvatarStyleContext>;
}

export function useAvatarStyle(): AvatarStyle {
  return useContext(AvatarStyleContext);
}
