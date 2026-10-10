import { publicShareImage } from "../../../../lib/public-share";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) { return publicShareImage((await params).id); }
export async function HEAD(_request: Request, { params }: Context) { return publicShareImage((await params).id, true); }
