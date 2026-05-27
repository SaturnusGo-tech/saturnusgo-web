import { NextResponse } from "next/server";

const GEOAPIFY_TILE_URL = "https://maps.geoapify.com/v1/tile/toner-grey";

type TileParams = {
  params: {
    x: string;
    y: string;
    z: string;
  };
};

export const revalidate = 60 * 60 * 24 * 7;

export async function GET(_: Request, { params }: TileParams) {
  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GEOAPIFY_API_KEY" },
      { status: 500 },
    );
  }

  const { x, y, z } = params;

  if (![x, y, z].every((value) => /^\d+$/.test(value))) {
    return NextResponse.json({ error: "Invalid tile" }, { status: 400 });
  }

  const tileUrl = `${GEOAPIFY_TILE_URL}/${z}/${x}/${y}.png?apiKey=${apiKey}`;
  const response = await fetch(tileUrl, {
    next: { revalidate },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Geoapify tile request failed" },
      { status: response.status },
    );
  }

  return new Response(await response.arrayBuffer(), {
    headers: {
      "Cache-Control": "public, max-age=604800, stale-while-revalidate=604800",
      "Content-Type": response.headers.get("content-type") ?? "image/png",
    },
  });
}
