# WanderMood: travel India by mood

Full-stack travel website. **React (Vite) + HTML/CSS/JS front end, Node/Express back end** with a JSON-file database (no database install needed).

## Run it (2 terminals)

```bash
# one-time
npm run install:all

# terminal 1: API on http://localhost:5000
npm run dev:server

# terminal 2: website on http://localhost:5173
npm run dev:client
```

Open http://localhost:5173

### Single-server mode (production style)
```bash
npm run install:all && npm run build && npm start
```
Open http://localhost:5000 (Express serves the built React app).

## Demo logins
| Role  | Email | Password |
|-------|-------|----------|
| Admin | admin@wandermood.in | admin123 |
| User  | user@wandermood.in  | user123  |

`server/db.json` is created on first start (with sample users, bookings and reviews). Delete it to reset all data.

## Feature map
| Requirement | Where |
|---|---|
| Registration & login (JWT, bcrypt, protected routes) | `pages/Account.jsx`, `server/index.js` |
| 37 Indian destinations, mood-tagged | `server/data.js` |
| Search & filter (text, mood, budget, days, sort) | `pages/Destinations.jsx` |
| Tour package details (day-by-day, vibe meter, inclusions) | `pages/PackageDetail.jsx` |
| Hotel booking (111 hotels, 3 tiers each) | `pages/Booking.jsx` |
| Flight booking (30 airports, sort by price/duration) | `pages/Booking.jsx` |
| Itinerary (drag & drop, cost, share link, print) | `pages/Itinerary.jsx` |
| Photo gallery (masonry, mood filter, keyboard lightbox) | `pages/Gallery.jsx` |
| Reviews & ratings (value / safety / scenery) | `pages/Destinations.jsx` |
| Contact form (validated, saved for admin) | `pages/Contact.jsx` |
| Responsive design | `styles.css` (mobile menu, fluid grids) |
| Admin panel (dashboard, users, bookings, packages CRUD, messages) | `pages/Admin.jsx` |
| ₹ and $ pricing | Navbar toggle + dual prices everywhere; checkout shows both totals; each booking stores `totalINR` and `totalUSD` |

## Currency
Base prices are in INR. The USD rate lives in `server/data.js` (`USD_PER_INR`, default 0.0115, about ₹87 per $1). Override with an env var: `USD_PER_INR=0.0118 npm start`.

## Notes
- Server recalculates every booking total itself, so the browser can't change prices.
- Payments are simulated (no real charge).
- Photos come from loremflickr keyword search and may not match perfectly; if one fails, a colour card is shown. To use your own photos, edit the `img()` helper in `server/data.js`.
- Set `JWT_SECRET` in production.
