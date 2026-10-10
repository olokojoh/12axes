import { publicSharePage } from "../../../lib/public-share";
import { isLocale } from "../../../i18n";
import { privateHeaders } from "../../../lib/billing-input";

type Context = { params: Promise<{ id: string; segment: string }> };
export async function GET(_request: Request, { params }: Context) {
  const { id, segment } = await params;
  const locale = isLocale(segment) ? segment : null;
  return locale ? publicSharePage(id, locale) : new Response("Not found", { status: 404, headers: privateHeaders });
}
export async function HEAD(_request: Request, { params }: Context) {
  const { id, segment } = await params;
  const locale = isLocale(segment) ? segment : null;
  return locale ? publicSharePage(id, locale, true) : new Response(null, { status: 404, headers: privateHeaders });
}
