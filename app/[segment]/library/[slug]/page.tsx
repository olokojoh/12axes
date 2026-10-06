import { notFound } from "next/navigation";
import { isLocale } from "../../../i18n";
import { LibraryPage, libraryMetadata } from "../../../LibraryPage";
import { requestBaseUrl } from "../../../site";
export async function generateMetadata({ params }: { params: Promise<{ segment: string; slug: string }> }) {
  const { segment, slug } = await params;
  if (!isLocale(segment)) notFound();
  return libraryMetadata(segment, await requestBaseUrl(), slug);
}
export default async function Page({ params }: { params: Promise<{ segment: string; slug: string }> }) {
  const { segment, slug } = await params;
  if (!isLocale(segment)) notFound();
  return <LibraryPage locale={segment} slug={slug} />;
}
