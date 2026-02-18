// components/admin/users-panel.tsx
"use client";

import { useState } from "react";

type User = {
  id:        string;
  name:      string;
  email:     string;
  role:      string;
  active:    boolean;
  createdAt: string | Date;
};

const inputClass = "w-full px-4 py-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-gold)] transition-colors duration-200 text-sm";

const labelClass = "block text-xs font-medium text-[var(--text-muted)] mb-1";

export function UsersPanel({ initialUsers }: { initialUsers: User[] }) {
  const [users,    setUsers]    = useState<User[]>(initialUsers);
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [role,     setRole]     = useState("user");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/admin/users", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "שגיאה ביצירת משתמש");
    } else {
      setUsers((prev) => [data.user, ...prev]);
      setSuccess(`המשתמש ${name} נוסף בהצלחה!`);
      setName(""); setEmail(""); setPassword(""); setRole("user");
    }
  }

  async function toggleUser(id: string, active: boolean) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ active: !active }),
    });

    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, active: !active } : u))
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Add user form ──────────────────────────────────────────────── */}
      <div className="bg-[var(--bg-tile)] border border-[var(--border)] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          ➕ הוסף משתמש חדש
        </h2>

        {error   && <p className="text-sm text-[var(--accent-coral)] mb-3">{error}</p>}
        {success && <p className="text-sm text-[var(--accent-teal)] mb-3">{success}</p>}

        <form onSubmit={addUser} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="add-user-name" className={labelClass}>שם מלא</label>
            <input
              id="add-user-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="add-user-email" className={labelClass}>אימייל</label>
            <input
              id="add-user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="add-user-password" className={labelClass}>סיסמה (8 תווים לפחות)</label>
            <input
              id="add-user-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="add-user-role" className={labelClass}>תפקיד</label>
            <select
              id="add-user-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={inputClass}
            >
              <option value="user">משתמש רגיל</option>
              <option value="admin">מנהל</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="
              sm:col-span-2 py-2.5 rounded-lg
              bg-[color-mix(in_srgb,var(--accent-gold)_85%,transparent)]
              backdrop-blur-sm border border-white/20
              text-white font-semibold text-sm
              hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            "
          >
            {loading ? "יוצר משתמש..." : "הוסף משתמש"}
          </button>
        </form>
      </div>

      {/* ── Users list ─────────────────────────────────────────────────── */}
      <div className="bg-[var(--bg-tile)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            משתמשים ({users.length})
          </h2>
        </div>

        <div className="divide-y divide-[var(--border-subtle)]">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-medium text-[var(--text-primary)] text-sm">
                  {user.name}
                  {user.role === "admin" && (
                    <span className="ms-2 text-xs px-2 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--accent-gold)_15%,transparent)] text-[var(--accent-gold)]">
                      מנהל
                    </span>
                  )}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{user.email}</p>
              </div>

              <button
                onClick={() => toggleUser(user.id, user.active)}
                className={`
                  text-xs px-3 py-1.5 rounded-md border transition-colors duration-200
                  ${user.active
                    ? "border-[var(--accent-coral)] text-[var(--accent-coral)] hover:bg-[color-mix(in_srgb,var(--accent-coral)_10%,transparent)]"
                    : "border-[var(--accent-teal)] text-[var(--accent-teal)] hover:bg-[color-mix(in_srgb,var(--accent-teal)_10%,transparent)]"
                  }
                `}
              >
                {user.active ? "השבת" : "הפעל"}
              </button>
            </div>
          ))}
        </div>
      </div>

    
    </div>
  );
}
