import { WhatsApp, Search, Grid } from "./IconsNew";
import type { Database } from "@/data/database";

export function MobileBottomNav({ db }: { db: Database }) {
  const wa = `https://wa.me/${db.site.whatsappNumber}?text=${encodeURIComponent(`Hi ${db.site.name}! Need help.`)}`;
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-white/[0.07] bg-[#040605]/70 backdrop-blur-2xl pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="mx-auto flex max-w-[1360px] items-center justify-around gap-1 px-2 py-2">
        <a href="#home" className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-mist hover:text-neon">
          <Grid className="h-5 w-5" />
          <span className="text-[10px] font-bold tracking-wide">Home</span>
        </a>
        <a href="#services" className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl bg-neon/10 px-1 py-1.5 text-neon border border-neon/20">
          <Search className="h-5 w-5" />
          <span className="text-[10px] font-bold tracking-wide">Services</span>
        </a>
        <a href={wa} target="_blank" rel="noopener noreferrer" className="flex min-w-0 max-w-[170px] flex-[1.6] items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-neon px-2 py-2.5 text-[12px] font-extrabold text-[#04150C] shadow-[0_8px_24px_-8px_rgba(29,184,106,0.7)] sm:text-[13px]">
          <WhatsApp className="h-[18px] w-[18px] shrink-0" /> WhatsApp
        </a>
        <a href="#contact" className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-mist hover:text-neon">
          <div className="h-5 w-5 grid place-items-center text-[14px]">✦</div>
          <span className="text-[10px] font-bold tracking-wide">Contact</span>
        </a>
      </div>
    </div>
  );
}
