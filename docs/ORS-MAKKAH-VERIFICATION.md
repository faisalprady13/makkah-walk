# Makkah pedestrian route verification checklist

OpenRouteService routes use the `foot-walking` profile and OpenStreetMap pedestrian data. A successful response is not proof of safe, accessible, open, or physically connected pedestrian access. Do not describe routes as independently verified until each route has been reviewed on the ground or against a reliable, current source.

## Manual checks

- [ ] Enable `ROUTING_PROVIDER=openrouteservice` with a server-only `OPENROUTESERVICE_API_KEY`.
- [ ] Check routes to and from Masjid al-Haram using multiple nearby entrances and surrounding streets.
- [ ] Check routes around Abraj Al Bait and nearby hotels, confirming the selected hotel entrance is reachable on foot.
- [ ] Check routes along surrounding pedestrian paths, sidewalks, crossings, bridges, and tunnels.
- [ ] Confirm each route does not pass through building footprints, restricted roads, construction areas, or pedestrian-prohibited spaces.
- [ ] Verify that mapped connections, crossings, ramps, stairs, and entrances correspond to current physical access.
- [ ] Compare every route against current local guidance or an independent, reliable source; record the date and source.
- [ ] Record missing connections or incorrect access points and avoid presenting the affected route as verified.

Automated tests mock the ORS HTTP response and do not consume API quota. Live route coverage and pedestrian accessibility require separate manual verification.
