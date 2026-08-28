import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { query } from "./db";

const COOKIE_NAME = "clinic_session";

export type DentistSession = {
  id: number;
  name: string;
  username: string;
  clinic_percentage: number;
};

function getSecret() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET || "fallback-secret-change-me"
  );
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(dentist: DentistSession) {
  const token = await new SignJWT({
    id: dentist.id,
    name: dentist.name,
    username: dentist.username,
    clinic_percentage: dentist.clinic_percentage,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<DentistSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      id: Number(payload.id),
      name: String(payload.name),
      username: String(payload.username ?? payload.email ?? ""),
      clinic_percentage: Number(payload.clinic_percentage ?? 0),
    };
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function refreshSessionFromDb(dentistId: number) {
  const rows = await query<
    {
      id: number;
      name: string;
      username: string;
      clinic_percentage: number;
    }[]
  >(
    "SELECT id, name, username, clinic_percentage FROM dentists WHERE id = :id",
    { id: dentistId }
  );
  const dentist = rows[0];
  if (!dentist) return null;
  await createSession(dentist);
  return dentist;
}

export async function loginDentist(username: string, password: string) {
  const rows = await query<
    {
      id: number;
      name: string;
      username: string;
      password_hash: string;
      clinic_percentage: number;
    }[]
  >("SELECT * FROM dentists WHERE username = :username LIMIT 1", { username });

  const dentist = rows[0];
  if (!dentist) return null;

  const ok = await verifyPassword(password, dentist.password_hash);
  if (!ok) return null;

  const session: DentistSession = {
    id: dentist.id,
    name: dentist.name,
    username: dentist.username,
    clinic_percentage: Number(dentist.clinic_percentage),
  };
  await createSession(session);
  return session;
}
