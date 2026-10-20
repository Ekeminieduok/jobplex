"use client";

import type { ReactNode } from "react";
import AnimatedContent from "@/components/react-bits/AnimatedContent";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export default function Reveal({
  children,
  className = "",
  delay = 0,
}: RevealProps) {
  return (
    <AnimatedContent
      distance={18}
      direction="vertical"
      duration={0.45}
      ease="power2.out"
      animateOpacity={false}
      scale={1}
      threshold={0}
      delay={delay}
      once
      className={`!visible ${className}`}
    >
      {children}
    </AnimatedContent>
  );
}