// app/api/admin/users/route.ts
import { auth } from "@/lib/auth";
import { findUserByEmail, createUser } from "@/lib/users";
import { NextRequest, NextResponse } from "next/server";

// Guard: admin only
async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return null;
  }
  return session;
}

// POST /api/admin/users - create a new user
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, email, password, role } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "שדות חסרים" }, { status: 400 });
  }

  const exists = findUserByEmail(email);
  if (exists) {
    return NextResponse.json({ error: "אימייל כבר קיים במערכת" }, { status: 409 });
  }

  const user = await createUser({
    name,
    email,
    password,
    role: role === "admin" ? "admin" : "user",
  });

  return NextResponse.json(
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        createdAt: user.createdAt,
      },
    },
    { status: 201 }
  );
}
