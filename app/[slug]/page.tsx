import { notFound } from "next/navigation";
import { GoodieSite, type SitePage } from "../site";

const pages = new Set<SitePage>(["about", "services", "cases", "process", "contact"]);

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!pages.has(slug as SitePage)) notFound();
  return <GoodieSite page={slug as SitePage} />;
}
