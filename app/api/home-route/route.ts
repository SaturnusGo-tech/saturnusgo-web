import { NextResponse } from "next/server";

const GEOAPIFY_ROUTE_URL = "https://api.geoapify.com/v1/routing";

const WAYPOINTS = [
  { label: "Times Square", lat: 40.758, lon: -73.9855 },
  { label: "Empire State", lat: 40.7484, lon: -73.9857 },
  { label: "Washington Square", lat: 40.7308, lon: -73.9973 },
] as const;

type GeoapifyGeometry = {
  type: "LineString" | "MultiLineString";
  coordinates: number[][] | number[][][];
};

type GeoapifyFeature = {
  geometry?: GeoapifyGeometry;
  properties?: {
    distance?: number;
    time?: number;
  };
};

type GeoapifyResponse = {
  features?: GeoapifyFeature[];
};

export const revalidate = 60 * 60 * 24;

export async function GET() {
  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GEOAPIFY_API_KEY" },
      { status: 500 },
    );
  }

  const url = new URL(GEOAPIFY_ROUTE_URL);
  url.searchParams.set(
    "waypoints",
    WAYPOINTS.map((point) => `${point.lat},${point.lon}`).join("|"),
  );
  url.searchParams.set("mode", "drive");
  url.searchParams.set("apiKey", apiKey);

  const response = await fetch(url, {
    next: { revalidate },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Geoapify route request failed" },
      { status: response.status },
    );
  }

  const data = (await response.json()) as GeoapifyResponse;
  const feature = data.features?.[0];
  const coordinates = flattenCoordinates(feature?.geometry);

  return NextResponse.json({
    coordinates,
    distanceMeters: feature?.properties?.distance ?? null,
    durationSeconds: feature?.properties?.time ?? null,
    waypoints: WAYPOINTS,
  });
}

function flattenCoordinates(geometry?: GeoapifyGeometry): number[][] {
  if (!geometry) {
    return [];
  }

  if (geometry.type === "LineString") {
    return geometry.coordinates as number[][];
  }

  return (geometry.coordinates as number[][][]).flat();
}
