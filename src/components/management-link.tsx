import Link from "next/link";
import { AnimalAvatar, animalFor } from "@/components/cozy-icons";
export function ManagementLink() {
  return <Link className="account-trigger" href="/settings" aria-label="管理设置"><span className="account-avatar" aria-hidden="true"><AnimalAvatar kind={animalFor("duty-day-home")} size={38}/></span><span className="account-name">管理设置<span>共享小天地</span></span></Link>;
}
