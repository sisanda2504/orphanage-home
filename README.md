# Hopeful Hearts Orphanage 🧡

A full-stack web management system for **Hopeful Hearts**, a non-profit orphanage dedicated to providing children with a safe home, quality education, and healthcare. The platform includes a public-facing website and a protected admin dashboard for internal operations.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES Modules) |
| Auth & Database | [Supabase](https://supabase.com) |
| Charts | [Chart.js 4](https://www.chartjs.org/) |
| Icons | [Font Awesome 6](https://fontawesome.com/) |
| PDF Export | [jsPDF](https://github.com/parallax/jsPDF) |
| Email | [EmailJS](https://www.emailjs.com/) |
| Maps | [Leaflet](https://leafletjs.com/) + [Nominatim](https://nominatim.org/) geocoding |

No build tools or frameworks — runs directly in the browser.

---

## Project Structure

```
orphanage-home/
├── index.html              # Public home page
├── login.html              # Sign-in page
├── signup.html             # Registration page
├── donate.html             # Donation page (auth required)
├── balance.html            # User balance & deposit page (auth required)
├── events.html             # Public events & RSVP page
├── impact.html             # Real-time donation map
├── tour.html               # Interactive virtual tour
├── tickets.html            # Support ticket submission (auth required)
├── gallery.html            # Public photo gallery
├── styles.css              # Shared public styles
├── script.js               # Shared public JS (chatbot, hamburger menu)
├── supabase-config.js      # Supabase client setup
├── logo.png                # Brand logo
├── kids.jpg                # Hero image
├── images/                 # Tour room images
├── email-templates/        # EmailJS HTML email templates
└── admin/
    ├── admin.html          # Admin dashboard
    ├── admin.css           # Dashboard styles
    ├── admin.js            # Dashboard logic
    ├── emailjs-config.js   # EmailJS keys & template IDs
    ├── gallery.html        # Admin media gallery manager
    └── media.html          # Admin media upload page
```

---

## Database Schema (Supabase)

| Table | Key Columns |
|---|---|
| `users` | `id`, `email`, `display_name`, `role`, `total_donated`, `donation_count`, `volunteer`, `volunteer_role`, `is_subscriber`, `subscription_amount`, `subscription_day`, `last_subscription_date` |
| `donations` | `id`, `user_id`, `user_email`, `amount`, `message`, `status`, `created_at`, `location`, `latitude`, `longitude` |
| `balances` | `user_id`, `balance`, `updated_at` |
| `events` | `id`, `name`, `description`, `date`, `location`, `max_attendees`, `registered`, `created_at` |
| `event_rsvps` | `id`, `event_id`, `user_id`, `user_name`, `user_email`, `created_at` |

The `donations` table is dual-purpose: positive `amount` values are deposits (status `'deposit'`), negative values are donations (status `'donation'`). Balance updates are handled via a Supabase RPC function `update_balance(p_user_id, p_amount)`.

---

## Getting Started

### Prerequisites
- A modern browser (Chrome, Firefox, Edge)
- A [Supabase](https://supabase.com) project with the tables above
- An [EmailJS](https://www.emailjs.com/) account with the templates configured

### Running locally

```bash
git clone https://github.com/MapokgoleSemoshwe/orphanage-home.git
cd orphanage-home
start index.html   # Windows
```

Or use the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) VS Code extension.

### Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL in `supabase-schema-updates.sql` and `supabase-rls-fix.sql` in the SQL editor
3. Replace the `supabaseUrl` and `supabaseAnonKey` values in every HTML/JS file
4. To make a user an admin, set their `role` column to `'admin'` in the `users` table

### EmailJS Setup

1. Create an account at [emailjs.com](https://www.emailjs.com/)
2. Create a service and the following templates:
   - `volunteerApproved` — sent when a volunteer application is approved
   - `sponsorFailed` — sent when a subscriber's payment fails or a reminder is needed
3. Update `admin/emailjs-config.js` with your public key, service ID, and template IDs

---

## Features — Public Site

### Home Page (`index.html`)
The landing page introduces the organisation with a hero section, mission cards (Safe Home, Quality Education, Healthcare), and a footer with contact details. The navbar adapts based on auth state:
- Unauthenticated users see **Sign In** and **Join Us** buttons
- Authenticated users see their display name, a **Balance** link, and a **Logout** button
- Admin users additionally see a **Dashboard** link in the nav

A hamburger drawer on mobile exposes links to Volunteer, Virtual Tour, Impact Map, and Events.

The **Donate Now** button redirects unauthenticated users to login with a return URL. Authenticated users go directly to `donate.html`.

The **Volunteer section** is hidden until a user is logged in. Once visible, clicking "Become a Volunteer" opens a modal where the user selects an activity (Tutoring, Cleaning, or Cooking). On submit, the `users` table is updated with `volunteer = 'Y'` and the chosen `volunteer_role`. The form pre-fills the user's name and email from their Supabase profile.

A **chatbot widget** is available on every public page. It responds to preset prompts (Donate, Volunteer, Visit, Contact) and free-text questions with scripted answers about the organisation.

---

### Authentication (`login.html`, `signup.html`)

**Sign Up** (`signup.html`):
- Collects full name, email, and password (minimum 6 characters)
- Users choose between Regular User and Admin account types
- Selecting Admin reveals an admin code field — the correct code (`hopeful2026`) must be entered to register as admin
- On success, regular users are redirected to `index.html`; admins go directly to `admin/admin.html`
- The `display_name` and `role` are stored in Supabase `user_metadata` at signup and synced to the `users` table

**Sign In** (`login.html`):
- Email and password login via Supabase Auth
- After login, the user's `role` is checked in the `users` table
- Admin users are automatically redirected to `admin/admin.html`
- Regular users are redirected to the `return` URL query parameter (e.g. `donate.html`) or `index.html`

---

### Balance & Deposits (`balance.html`)
Requires authentication. Shows the user's current balance in a styled card and their last 20 transactions.

**Add Funds (mock card deposit)**:
- User enters an amount (minimum R10), card number, expiry date (MM/YY), and CVV
- Card number is validated using the Luhn algorithm
- Expiry is checked against the current date
- On success, a positive `amount` record is inserted into `donations` with `status = 'deposit'` and the `update_balance` RPC is called to add funds

**Monthly Subscription**:
- Users can opt in to become a monthly donor by toggling the subscription radio to "Yes"
- They set a monthly amount (minimum R10) and a day of the month for the deduction
- On save, the `users` table is updated with `is_subscriber = 'Y'`, `subscription_amount`, and `subscription_day`
- To cancel, the user selects "No" which sets `is_subscriber = 'N'` and `subscription_amount = 0`

---

### Donations (`donate.html`)
Requires authentication. Allows users to donate from their balance.

- Displays the user's current balance, total donated, and donation count
- Preset amount buttons (R10, R25, R50, R100, R250, R500) are disabled if the user's balance is insufficient
- A custom amount field accepts any value up to the available balance
- User enters their location (city, country) which is geocoded via the Nominatim OpenStreetMap API to get latitude/longitude coordinates. If geocoding fails, it defaults to Cape Town
- On submit, a negative `amount` record is inserted into `donations` with `status = 'donation'` and the `update_balance` RPC subtracts the amount from the balance
- The `users` table `total_donated` and `donation_count` fields are updated accordingly

---

### Events & RSVP (`events.html`)
Public page showing all upcoming events fetched live from the Supabase `events` table.

- Events are displayed as cards with name, date, location, description, and available spots
- A **countdown timer** at the top counts down in days, hours, minutes, and seconds to the next upcoming event
- Authenticated users can **RSVP** to events. The RSVP is saved to the `event_rsvps` table and the `registered` count on the event is incremented
- Users cannot RSVP to a full event (registered >= max_attendees)
- Users who have already RSVPed see a "Cancel RSVP" option which removes their record and decrements the count

---

### Impact Map (`impact.html`)
Public page showing a real-time Leaflet.js map of donation locations.

- Fetches all donations with latitude/longitude from Supabase
- Each donation is plotted as an animated pulsing marker on the map
- Clicking a marker shows the donor's location and donation amount
- A sidebar shows a **Recent Supporter Activity** timeline with donor names, amounts, and relative timestamps
- Dashboard stats show total funds raised, number of active supporters, and number of cities reached

---

### Virtual Tour (`tour.html`)
Public interactive tour of the orphanage with four rooms: Lobby & Reception, Study & Library, Dining Hall & Kitchen, and Outdoor Playground.

- Clicking a room tab swaps the main image and description
- Each room has **interactive hotspots** overlaid on the image. Clicking a hotspot reveals a detail panel with information about that area
- A **narrated audio guide** uses the Web Speech API (text-to-speech) to read the room description aloud. Play, Pause, and Stop controls are provided
- An animated soundwave visualiser plays while narration is active

---

### Support Tickets (`tickets.html`)
Requires authentication. Allows users to submit support messages to the admin team.

- The form pre-fills the user's name and email (read-only) from their Supabase profile
- On submit, the ticket is saved to `localStorage` under `hh_messages` and also written to `hh_activity` and `hh_notifs` so the admin dashboard picks it up in real time via the `storage` event
- A floating 🎫 button opens a slide-out drawer showing the user's submitted tickets with their status (Sent / Reviewed) and relative timestamps that update every 5 seconds
- The admin dashboard detects new tickets via the `storage` event and plays an audio chime alert

---

### Gallery (`gallery.html`)
Public photo gallery displaying images uploaded by admins. Images are fetched from the admin media store and displayed in a responsive grid.

---

## Features — Admin Dashboard (`admin/admin.html`)

Access is protected by an auth guard that checks the user's session and `role` in the `users` table. Non-admin users are redirected to `index.html`. The dashboard body is hidden (`visibility: hidden`) until the auth check completes to prevent flash of content.

---

### Dashboard Overview
The home section displays six stat cards updated in real time:
- **Total Donations** — sum of all completed donations from Supabase
- **Total Volunteers** — count of users with `volunteer = 'Y'`
- **Total Sponsors** — count of users with `is_subscriber = 'Y'` from the live DB query
- **Children in Care** — static value (47)
- **Upcoming Events** — count of events with a future date
- **Inventory Alerts** — count of items at or below minimum stock level

Two bar charts are rendered with Chart.js:
- **Donation Trends** — monthly totals of completed donations for the current year
- **Volunteer Registrations** — monthly count of new volunteer sign-ups

A **Recent Activity** feed shows the last 8 admin actions (stored in `localStorage`).

**Quick Actions** buttons navigate directly to the relevant section.

---

### Volunteers
Fetches all users with `volunteer = 'Y'` from Supabase on load. Locally-added volunteers (added manually via the form) are merged with the DB results.

- **Search** by name, email, or activity
- **Filter** by status (Pending, Approved, Rejected)
- **Add Volunteer** — opens a modal form to manually add a volunteer with name, email, phone, activity (Tutoring, Cleaning, Cooking, Other), availability, and status
- **View** — opens a detail modal showing all volunteer info and data source (online vs manually added)
- **Approve / Reject** — updates the volunteer's local status. On approval, an EmailJS email is sent to the volunteer using the `volunteerApproved` template with their name, activity, and organisation contact details
- **Delete** — for DB-sourced volunteers, sets `volunteer = 'N'` and `volunteer_role = null` in Supabase. For local volunteers, removes from localStorage

---

### Donations
Fetches all records from the `donations` table on load. Manually recorded donations (added via the admin form) are merged with DB results.

- **Search** by donor name, email, or notes
- **Filter** by status (Completed, Pending, Failed)
- **Record Donation** — opens a modal to manually add a donation with donor name, email, amount, date, status, and notes. Saved to localStorage with `_source: 'local'`
- **View** — opens a detail modal showing all donation info and whether it came from the database or was manually recorded
- **Edit / Delete** — only available for manually-recorded donations, not DB records

Amounts stored in the DB as negative numbers (donations) are converted to positive for display using `Math.abs()`.

---

### Messages
Reads support tickets from `localStorage` (`hh_messages`). New tickets submitted from `tickets.html` appear in real time via the `storage` event listener, which also triggers a two-tone audio chime.

- **Search** by name, email, subject, or message content
- **Filter** by read/unread status
- Unread messages are displayed in bold
- **View** — marks the message as read and opens a detail modal with a "Reply via Email" button that opens a pre-filled `mailto:` link
- **Mark Read** — marks a message as read without opening it
- **Delete** — removes the message from localStorage

---

### Events
Fetches all events from the Supabase `events` table. Locally-created events are merged with DB results.

- **Search** by event name or location
- **Create Event** — opens a modal form with name, description, date, location, and max attendees. New events are saved directly to Supabase if the DB connection is available, otherwise fall back to localStorage
- **Edit** — DB events are updated in Supabase; local events are updated in localStorage
- **Delete** — DB events are deleted from Supabase; local events are removed from localStorage
- **View** — opens a detail modal showing event info and a live list of RSVPs fetched from the `event_rsvps` table, showing each attendee's name, email, and RSVP date

---

### Inventory
Manages stock levels stored in `localStorage`. Pre-seeded with six default items on first load.

- Items have a name, category, quantity, minimum stock level, and unit
- Status is calculated automatically: **OK** (above min), **Low Stock** (at or below min), **Critical** (zero quantity)
- **Add Item** — opens a modal form
- **Edit** — updates item details
- **Restock** — prompts for a quantity to add to the current stock
- **Delete** — removes the item
- Low-stock items trigger a notification and toast alert when saved
- The inventory alert count is shown as a red badge on the sidebar nav item and in the dashboard stat card

---

### Sponsorships (Subscribed Sponsors)
Fetches all users with `is_subscriber = 'Y'` from Supabase on load. This is a read-only live view — no manual add/edit/delete.

- **Search** by name or email
- **Refresh** button re-fetches the latest data from Supabase
- Table columns: Name, Email, Monthly Amount, Billing Day, Last Payment, Status
- **Last Payment** shows the `last_subscription_date` formatted as a local date, or "N/A" if not yet processed
- **Status** is always shown as "Active" since only subscribed users (`is_subscriber = 'Y'`) are displayed
- **View** — opens a detail modal showing all subscription fields including billing day and last payment timestamp
- **Email** — sends a payment reminder email via EmailJS using the `sponsorFailed` template, passing the subscriber's name, email, monthly amount, billing day, and organisation details. Shows a success or error toast and logs the action to the activity feed

---

### Reports & PDF Export
Generates downloadable PDF reports using jsPDF for five data types:

- **Monthly Donations** — lists all donations with donor, email, amount, date, and status
- **Volunteer Applications** — lists all volunteers with name, email, skills, availability, and status
- **Event Attendance** — lists all events with name, date, location, max attendees, and registered count
- **Sponsorship Report** — lists all sponsorships with child, sponsor, amount, status, and next payment
- **Inventory Report** — lists all inventory items with name, category, quantity, min stock, and status

Each PDF includes the organisation name, report title, and generation date as a header.

---

### Notifications
A bell icon in the topbar shows a red dot when there are unread notifications. Clicking it opens a dropdown panel.

- Notifications are added automatically when key actions occur (new volunteer, new donation, new message, low stock alert, email sent)
- **Clear All** removes all notifications
- Notifications persist in `localStorage` across page refreshes

---

### Activity Log
The dashboard home page shows a feed of the last 8 admin actions with icons, descriptions, and timestamps. The full log (up to 20 entries) is stored in `localStorage` and updated whenever significant actions are performed.

---

### Global Search
The search box in the topbar filters visible table rows across all sections by matching the query against all text content in each row.

---

### Dark Mode
A moon/sun toggle button in the topbar switches between light and dark themes. The preference is saved to `localStorage` and restored on next visit. All colours use CSS custom properties that update automatically when the `data-theme` attribute on `<html>` changes.

---

### Sidebar Navigation
The sidebar collapses on desktop (slides off-screen, expanding the main content area) and slides in as an overlay on mobile. A semi-transparent backdrop closes it on mobile when tapped.

---

## Email Templates

Three HTML email templates are stored in `email-templates/` and configured in EmailJS:

| Template | Trigger | Variables |
|---|---|---|
| `volunteer_approved.html` | Admin approves a volunteer | `to_name`, `to_email`, `activity`, `org_name`, `contact_email` |
| `sponsor_payment_failed.html` | Admin clicks Email on a subscriber | `to_name`, `to_email`, `amount`, `due_date`, `org_name`, `contact_email` |
| `sponsor_payment_due.html` | Scheduled payment due reminder | `to_name`, `to_email`, `amount`, `due_date`, `org_name`, `contact_email` |

---

## Branches

| Branch | Description |
|---|---|
| `main` | Stable production code |
| `Nurr` | Active development branch |
| `Ntando` | Active development branch |
| `Semoshwe` | Active development branch |
| `Sisanda` | Active development branch |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to your branch and open a pull request against `main`

---

## License

This project is for educational and non-profit use. All rights reserved © 2026 Hopeful Hearts Orphanage.
