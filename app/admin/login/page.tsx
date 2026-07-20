"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(formData: FormData) {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: String(formData.get("email")),
      password: String(formData.get("password")),
    });
    if (error) {
      setError("E-posta veya şifre hatalı.");
      setLoading(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="login-shell">
      <form className="login-card" action={login}>
        <div className="brand-mark">M</div>
        <p className="eyebrow">MECİTOĞLU GRUP</p>
        <h1>Yönetici Girişi</h1>
        <label><span>E-posta</span><input name="email" type="email" required /></label>
        <label><span>Şifre</span><input name="password" type="password" required /></label>
        {error && <div className="notice error">{error}</div>}
        <button className="btn btn-primary submit" disabled={loading}>
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </form>
    </main>
  );
}
