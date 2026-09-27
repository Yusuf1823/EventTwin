import React from 'react';
import { cn } from './cn';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('et-skeleton', className)} />
);
