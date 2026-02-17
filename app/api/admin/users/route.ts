// app/api/admin/users/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// Guard: admin only
async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
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

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "אימייל כבר קיים במערכת" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: role === "admin" ? "admin" : "user",
    },
    select: {
      id: true, name: true, email: true,
      role: true, active: true, createdAt: true,
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}
