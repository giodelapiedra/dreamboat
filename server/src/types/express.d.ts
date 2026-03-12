import type { Role } from "@dreamboat/shared";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: Role;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};
