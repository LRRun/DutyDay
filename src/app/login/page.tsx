import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions";
import { getSession } from "@/lib/auth";
import { LoginSubmit } from "@/components/login-submit";
import { HomeIcon, PlantIcon } from "@/components/cozy-icons";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getSession()) redirect("/dashboard");
  const { error } = await searchParams;
  const errorMessage = error === "locked" ? "尝试次数过多，请 15 分钟后再试。" : error ? "邮箱或密码不正确。" : null;
  return <main className="login"><section className="login-card"><PlantIcon className="login-plant" size={72} />
    <div className="login-brand"><span className="brand-mark"><HomeIcon size={22} /></span><strong>Duty Day</strong></div>
    <h1>管理员登录</h1>
    {errorMessage && <p className="notice" role="alert">{errorMessage}</p>}
    <form action={loginAction}>
      <div className="field"><label htmlFor="email">管理员邮箱</label><input className="input" id="email" name="email" type="email" autoComplete="username" required /></div>
      <div className="field"><label htmlFor="password">密码</label><input className="input" id="password" name="password" type="password" autoComplete="current-password" required /></div>
      <LoginSubmit />
    </form>
  </section></main>;
}
