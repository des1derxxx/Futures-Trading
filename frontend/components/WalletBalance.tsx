"use client";

interface WalletBalanceProps {
  balance: number;
  reservedBalance: number;
}

export default function WalletBalance({ balance, reservedBalance }: WalletBalanceProps) {
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="bg-[#0d1420] border border-zinc-800/60 rounded-xl p-4 flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Кошелёк</h3>
      <div className="flex justify-between items-center">
        <span className="text-sm text-zinc-400">Доступно</span>
        <span className="font-mono text-white text-sm">${fmt(balance)}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-zinc-400">В позициях</span>
        <span className="font-mono text-yellow-400 text-sm">${fmt(reservedBalance)}</span>
      </div>
      <div className="border-t border-zinc-800 pt-2 flex justify-between items-center">
        <span className="text-sm text-zinc-400">Итого</span>
        <span className="font-mono text-white text-sm font-semibold">${fmt(balance + reservedBalance)}</span>
      </div>
    </div>
  );
}
