"use client";
import Link from "next/link";
import BtcPrice from "./BtcPrice";
import ChatModal from "./ChatModal";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

const Header = () => {
  const router = useRouter();
  const isAuth = localStorage.getItem("token");
  const [chatOpened, setChatOpened] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (isAuth) {
      api.me().then((user) => {
        setIsAdmin(!!user.is_admin);
      }).catch(() => {});
    }
  }, [isAuth]);

  return (
    <>
      <header className="border-b border-zinc-800/60 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span
            className="font-bold text-white hover:cursor-pointer"
            onClick={() => router.push("/")}
          >
            Futures Trading
          </span>
          <BtcPrice />
        </div>
        {isAuth && (
          <div className="flex items-center gap-4">
            <Link
              href="/tournaments"
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Турниры
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
            {isAdmin && (
              <Link
                href="/admin"
                className="text-xs text-yellow-500 hover:text-yellow-300 transition-colors"
              >
                Админ
              </Link>
            )}
            <button
              onClick={() => {
                localStorage.removeItem("token");
                router.replace("/auth");
              }}
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
