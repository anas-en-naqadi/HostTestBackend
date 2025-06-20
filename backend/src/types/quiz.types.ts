import { Request } from 'express';
import { user_status } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    username: string;
    full_name: string;
    role_id: number;
    role: string;
    status: user_status;
    permissions: string[];
    last_login: Date; // ✅ Ajoute ceci pour matcher avec ce qui est attendu
  };
}
