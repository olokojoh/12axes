import { publicSharePage } from "../../lib/public-share";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) { return publicSharePage((await params).id, "en"); }
export async function HEAD(_request: Request, { params }: Context) { return publicSharePage((await params).id, "en", true); }
