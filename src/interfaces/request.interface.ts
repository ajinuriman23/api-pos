import { Request } from 'express';
import { User } from '@supabase/supabase-js';


type Outlet = {
    id: string;
    name: string;
}

export default interface RequestWithUser extends Request {
    user?: User;
    outlet?: Outlet | Outlet[] | null;
    

}