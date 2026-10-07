import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const COOKIE_NAME = "rk_session";
const SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-me";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

function sign(payload: string) {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

export async function createSession(userId: string) {
  const payload = `${userId}.${Date.now()}`;
  const token = `${payload}.${sign(payload)}`;
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionUser() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, ts, sig] = parts;
  if (sign(`${userId}.${ts}`) !== sig) return null;

  const raw = await prisma.user.findUnique({
    where: { id: userId },
    include: { restaurant: true },
  });
  if (!raw) return null;

  // restaurantId est null uniquement pour les super-admins, cantonnés à la
  // section /admin. Incohérence inattendue = session invalide.
  if (raw.restaurantId === null && raw.role !== "SUPERADMIN") return null;

  // Les pages de l'espace restaurant vérifient les permissions AVANT d'utiliser
  // restaurantId ou restaurant, donc un super-admin ne peut jamais y arriver.
  type AppUser = Omit<NonNullable<typeof raw>, "restaurantId" | "restaurant"> & {
    restaurantId: string;
    restaurant: NonNullable<NonNullable<typeof raw>["restaurant"]>;
  };
  return raw as AppUser;
}
