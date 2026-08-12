import { notFound } from "next/navigation";
import content from "../../../content/goodie-content.json";
import { CaseDetailPage } from "../../site";

export default async function Page({ params }: { params: Promise<{ caseSlug: string }> }) {
  const { caseSlug } = await params;
  if (!content.cases.some((item) => item.slug === caseSlug)) notFound();
  return <CaseDetailPage slug={caseSlug} />;
}

export function generateStaticParams() {
  return content.cases.map((item) => ({ caseSlug: item.slug }));
}
