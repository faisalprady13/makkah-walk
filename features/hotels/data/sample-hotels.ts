import type { Hotel } from "@/domain/entities/hotel";
import type { Location } from "@/domain/entities/location";

export const HOTEL_ROUTE_ORIGIN: Location = {
  id: "masjid-al-haram",
  name: "Masjid al-Haram",
  category: "landmark",
  address: "Makkah",
  coordinates: { latitude: 21.4225, longitude: 39.8262 },
  source: "sample",
};

// OSM object IDs identify the mapped features whose coordinates are used below.
export const SAMPLE_HOTELS: readonly Hotel[] = [
  {
    id: "osm-way-187627185",
    name: "Al Fajer Al Badya 2 Hotel",
    category: "hotel",
    address: "Talat Al Masafi Street · Ajyad",
    coordinates: { latitude: 21.4161221, longitude: 39.82893 },
    source: "sample",
  },
  {
    id: "osm-way-539477577",
    name: "Makkah Millennium Hotel",
    category: "hotel",
    address: "Al Misyal Road · Ajyad",
    coordinates: { latitude: 21.4189959, longitude: 39.8235531 },
    source: "sample",
  },
  {
    id: "osm-way-187620634",
    name: "Sheraton Makkah - Jabal Al Kaaba Hotel",
    category: "hotel",
    address: "Jabal Al Kaaba Street · Jarwal",
    coordinates: { latitude: 21.425594, longitude: 39.8194398 },
    source: "sample",
  },
  {
    id: "osm-way-678641730",
    name: "Tharawat Naba Makkah Hotel",
    category: "hotel",
    address: "Bir Balilah Street · Ajyad",
    coordinates: { latitude: 21.413529, longitude: 39.8307168 },
    source: "sample",
  },
  {
    id: "osm-node-5077417300",
    name: "Hotel Pullmann ZamZam Makkah",
    category: "hotel",
    address: "First Ring Road · Ajyad",
    coordinates: { latitude: 21.4183327, longitude: 39.8249601 },
    source: "sample",
  },
];
