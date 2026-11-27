import React from 'react';
import { Badge } from './Badge';

export const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const upper = status.toUpperCase();
  if (['PRESENT', 'ACTIVE', 'PASS', 'NORMAL'].includes(upper)) {
    return <Badge variant="success">{upper}</Badge>;
  }
  if (['ABSENT', 'FAIL', 'URGENT', 'SUSPENDED', 'EXPIRED'].includes(upper)) {
    return <Badge variant="danger">{upper}</Badge>;
  }
  if (['LATE', 'TRIAL', 'PTM', 'EXAM'].includes(upper)) {
    return <Badge variant="warning">{upper}</Badge>;
  }
  if (['LEAVE', 'HOLIDAY', 'EVENT'].includes(upper)) {
    return <Badge variant="info">{upper}</Badge>;
  }
  return <Badge>{upper}</Badge>;
};
