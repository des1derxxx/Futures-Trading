"use client";
import Link from "next/link";
import BtcPrice from "./BtcPrice";
import ChatModal from "./ChatModal";
import { useRouter } from "next/navigation";
import { useState } from "react";

const Header = () => {
  const router = useRouter();
  const isAuth = localStorage.getItem("token");
  const [chatOpened, setChatOpened] = useState(false);

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
