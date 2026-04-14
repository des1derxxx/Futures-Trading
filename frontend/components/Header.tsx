"use client";
import Link from "next/link";
import BtcPrice from "./BtcPrice";
import ChatModal from "./ChatModal";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useGetMeQuery } from "@/lib/apiSlice";
import { useTournamentNotifications } from "@/hooks/useNotifications";
import NotificationCenter from "./NotificationCenter";

const Header = () => {
  const router = useRouter();
  const [chatOpened, setChatOpened] = useState(false);
  const { data: me } = useGetMeQuery();
  useTournamentNotifications(me?.id ?? null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "auth_token=; path=/; max-age=0";
    router.replace("/auth");
  };

  return (
    <>
      <header className="border-b border-zinc-800/60 px-6 py-3 flex items-center justify-between bg-[#080d14]">
        <div className="flex items-center gap-4">
          <span
            className="font-bold text-white hover:cursor-pointer"
            onClick={() => router.push("/")}
          >
            Futures Trading
          </span>
          <BtcPrice />
        </div>
        {me && (
          <div className="flex items-center gap-4">
            <Link
              href="/tournaments"
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Турниры
            </Link>
            <Link
              href="/chat"
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Чат
            </Link>
            <button
              onClick={() => setChatOpened(true)}
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Ai Chat
            </button>
            <Link
              href="/profile"
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Профиль
            </Link>
            {me.is_admin && (
              <Link
                href="/admin"
                className="text-xs text-yellow-500 hover:text-yellow-300 transition-colors"
              >
                Админ
              </Link>
            )}
            <NotificationCenter />
            <button
              onClick={handleLogout}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Выйти
            </button>
          </div>
        )}
      </header>
      <ChatModal opened={chatOpened} onClose={() => setChatOpened(false)} />
    </>
  );
};

export default Header;
