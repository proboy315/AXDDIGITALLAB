import {
  Bolt,
  Chart,
  ChatBubble,
  Code,
  Grid,
  Palette,
  PaperPlane,
  Robot,
  Rocket,
  ShopifyBag,
  Sparkle,
  WhatsApp,
} from "./Icons";

const map = {
  whatsapp: WhatsApp,
  code: Code,
  shopify: ShopifyBag,
  palette: Palette,
  chart: Chart,
  robot: Robot,
  rocket: Rocket,
  sparkle: Sparkle,
  plane: PaperPlane,
  chat: ChatBubble,
  shield: Chart,
  bolt: Bolt,
  grid: Grid,
} as const;

export type GlyphKey = keyof typeof map;

export function Glyph({
  name,
  className,
}: {
  name: GlyphKey;
  className?: string;
}) {
  const Cmp = map[name] ?? Sparkle;
  return <Cmp className={className} />;
}
