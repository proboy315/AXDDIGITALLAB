import App from "@/App";
import { defaultDatabase } from "@/data/database";

export default function HomePage() {
  return <App initialDb={defaultDatabase} />;
}
