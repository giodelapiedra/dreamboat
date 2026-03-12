import { Role } from "../../../generated/prisma";
import { StatusCodes } from "http-status-codes";

import { env } from "../../config/env";
import { HttpError } from "../../lib/http-error";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../lib/jwt";
import { comparePassword, hashPassword } from "../../lib/password";
import { prisma } from "../../lib/prisma";

function durationToMs(duration: string): number {
  const match = duration.match(/^(\d+)([mhd])$/);

  if (!match) {
    throw new Error(`Unsupported duration format: ${duration}`);
  }

  const value = Number(match[1]);
  const unit = match[2];

  if (unit === "m") {
    return value * 60 * 1000;
  }

  if (unit === "h") {
    return value * 60 * 60 * 1000;
  }

  return value * 24 * 60 * 60 * 1000;
}

function sanitizeUser(user: {
  id: string;
  name: string;
  email: string;
  image: string | null;
  phone: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

async function issueSession(user: {
  id: string;
  email: string;
  role: Role;
}): Promise<{ accessToken: string; refreshToken: string }> {
  const refreshTokenRecord = await prisma.refreshToken.create({
    data: {
      token: `pending-${crypto.randomUUID()}`,
      expiresAt: new Date(Date.now() + durationToMs(env.JWT_REFRESH_EXPIRES_IN)),
      userId: user.id,
    },
  });

  const refreshToken = signRefreshToken({
    sub: user.id,
    tokenId: refreshTokenRecord.id,
  });

  await prisma.refreshToken.update({
    where: { id: refreshTokenRecord.id },
    data: { token: refreshToken },
  });

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  return { accessToken, refreshToken };
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  role?: "GUEST" | "HOST";
}): Promise<{
  accessToken: string;
  refreshToken: string;
  user: ReturnType<typeof sanitizeUser>;
}> {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new HttpError(StatusCodes.CONFLICT, "Email address is already in use");
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: await hashPassword(input.password),
      role: input.role ?? Role.GUEST,
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      phone: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const session = await issueSession({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    ...session,
    user: sanitizeUser(user),
  };
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<{
  accessToken: string;
  refreshToken: string;
  user: ReturnType<typeof sanitizeUser>;
}> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      image: true,
      phone: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  const isPasswordValid = await comparePassword(input.password, user.password);

  if (!isPasswordValid) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  const { password: _password, ...safeUser } = user;
  const session = await issueSession({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    ...session,
    user: sanitizeUser(safeUser),
  };
}

export async function refreshSession(
  currentRefreshToken: string,
): Promise<{
  accessToken: string;
  refreshToken: string;
  user: ReturnType<typeof sanitizeUser>;
}> {
  const payload = verifyRefreshToken(currentRefreshToken);

  const existingToken = await prisma.refreshToken.findUnique({
    where: { id: payload.tokenId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!existingToken || existingToken.token !== currentRefreshToken) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, "Refresh token is invalid");
  }

  await prisma.refreshToken.delete({
    where: { id: existingToken.id },
  });

  const session = await issueSession({
    id: existingToken.user.id,
    email: existingToken.user.email,
    role: existingToken.user.role,
  });

  return {
    ...session,
    user: sanitizeUser(existingToken.user),
  };
}

export async function logout(currentRefreshToken: string): Promise<void> {
  const payload = verifyRefreshToken(currentRefreshToken);

  await prisma.refreshToken.deleteMany({
    where: {
      id: payload.tokenId,
      token: currentRefreshToken,
    },
  });
}

export async function getCurrentUser(userId: string): Promise<
  ReturnType<typeof sanitizeUser>
> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      phone: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new HttpError(StatusCodes.NOT_FOUND, "User not found");
  }

  return sanitizeUser(user);
}


