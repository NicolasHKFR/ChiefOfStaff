import { useMemo } from "react";
import { Card, Group, Table, Text, Title } from "@mantine/core";
import { IconMapPin } from "@tabler/icons-react";
import { divIcon } from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useLocations, useWorkers } from "../api/hooks";

interface LocationGroup {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  count: number;
  workers: string[];
}

const FALLBACK_COORDS: Record<string, { lat: number; lng: number; country: string }> = {
  "Thailand": { lat: 15.8700, lng: 100.9925, country: "Thailand" },
  "Vietnam": { lat: 14.0583, lng: 108.2772, country: "Vietnam" },
  "Philippines": { lat: 12.8797, lng: 121.7740, country: "Philippines" },
  "Indonesia": { lat: -0.7893, lng: 113.9213, country: "Indonesia" },
  "Malaysia": { lat: 4.2105, lng: 101.9758, country: "Malaysia" },
  "South Korea": { lat: 35.9078, lng: 127.7669, country: "South Korea" },
  "Taiwan": { lat: 23.6978, lng: 120.9605, country: "Taiwan" },
  "India": { lat: 20.5937, lng: 78.9629, country: "India" },
  "China": { lat: 35.8617, lng: 104.1954, country: "China" },
};

function buildGroups(
  workers: { first_name: string; last_name: string; office_location?: string | null }[],
  locationMap: Map<string, { country: string; latitude: number; longitude: number }>,
): LocationGroup[] {
  const raw = new Map<string, { names: string[]; geo: { country: string; lat: number; lng: number } | null }>();

  for (const w of workers) {
    const loc = w.office_location || "Unknown";
    if (!raw.has(loc)) {
      const managed = locationMap.get(loc);
      const fallback = FALLBACK_COORDS[loc];
      let geo: { country: string; lat: number; lng: number } | null = null;
      if (managed) {
        geo = { country: managed.country, lat: managed.latitude, lng: managed.longitude };
      } else if (fallback) {
        geo = fallback;
      }
      raw.set(loc, { names: [], geo });
    }
    raw.get(loc)!.names.push(`${w.first_name} ${w.last_name}`);
  }

  const result: LocationGroup[] = [];
  for (const [name, { names, geo }] of raw) {
    if (geo) {
      result.push({
        name,
        country: geo.country,
        latitude: geo.lat,
        longitude: geo.lng,
        count: names.length,
        workers: names,
      });
    }
  }
  return result;
}

function countIcon(count: number) {
  return divIcon({
    className: "",
    html: `<div style="
      width:36px;height:36px;border-radius:50%;
      background:#228be6;color:#fff;
      display:flex;align-items:center;justify-content:center;
      font-size:14px;font-weight:700;
      border:2px solid #fff;
      box-shadow:0 1px 4px rgba(0,0,0,.3);
    ">${count}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

export default function MapWorld() {
  const { data: workers } = useWorkers({});
  const { data: locations } = useLocations();

  const locationMap = useMemo(() => {
    const m = new Map<string, { country: string; latitude: number; longitude: number }>();
    if (!locations) return m;
    for (const loc of locations) {
      if (loc.latitude != null && loc.longitude != null) {
        m.set(loc.name, { country: loc.country || loc.name, latitude: loc.latitude, longitude: loc.longitude });
      }
    }
    return m;
  }, [locations]);

  const groups = useMemo(() => {
    if (!workers) return [];
    return buildGroups(workers, locationMap);
  }, [workers, locationMap]);

  const countryTotals = useMemo(() => {
    const m = new Map<string, number>();
    for (const g of groups) {
      m.set(g.country, (m.get(g.country) || 0) + g.count);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [groups]);

  if (!workers || !locations) {
    return <Text c="dimmed" ta="center" py="xl">Loading map data...</Text>;
  }

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={2}>World Map</Title>
      </Group>

      <Group align="flex-start" gap="md">
        <Card withBorder style={{ flex: 1, minHeight: 600 }}>
          <MapContainer
            center={[10, 110]}
            zoom={3}
            minZoom={2}
            maxBounds={[[-60, 20], [60, 200]]}
            style={{ height: 600, width: "100%", borderRadius: 8 }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {groups.map((g) => (
              <Marker key={g.name} position={[g.latitude, g.longitude]} icon={countIcon(g.count)}>
                <Popup>
                  <Text fw={600} size="sm">{g.name}</Text>
                  <Text size="xs" c="dimmed">{g.country}</Text>
                  <Text size="xs">{g.count} worker{g.count !== 1 ? "s" : ""}</Text>
                  <ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>
                    {g.workers.map((name) => (
                      <li key={name}><Text size="xs">{name}</Text></li>
                    ))}
                  </ul>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </Card>

        <Card withBorder miw={260} maw={300}>
          <Group mb="sm">
            <IconMapPin size={20} />
            <Title order={4}>By Country</Title>
          </Group>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Country</Table.Th>
                <Table.Th ta="right">Staff</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {countryTotals.map(([country, total]) => (
                <Table.Tr key={country}>
                  <Table.Td fw={500}>{country}</Table.Td>
                  <Table.Td ta="right">{total}</Table.Td>
                </Table.Tr>
              ))}
              {countryTotals.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={2}><Text c="dimmed" ta="center">No data</Text></Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>
      </Group>
    </div>
  );
}
