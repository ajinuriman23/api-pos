import { Request } from 'express';
import { User } from '@supabase/supabase-js';
import Outlet from './outlet.interface';

export default interface RequestWithUser extends Request {
  user?: User;
  outlet?: Outlet | Outlet[] | null;
}
