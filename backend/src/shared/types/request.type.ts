import { Request } from 'express';
import { AuthUser } from '../interfaces';

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
