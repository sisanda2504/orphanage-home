# Hopeful Hearts Orphanage 🧡

A web-based management system for **Hopeful Hearts**, a non-profit orphanage dedicated to providing children with a safe home, quality education, and healthcare. The platform serves both the public-facing website and an admin dashboard for internal operations.

---

## Features

### Public Site
- **Home page** — introduction to the organisation, mission, and call-to-action
- **Authentication** — user sign-up and sign-in powered by Supabase Auth
- **Donations** — authenticated users can donate via preset or custom amounts (mock payment)
- **Role-based access** — admin users are automatically redirected to the dashboard after login

### Admin Dashboard
- **Overview stats** — total donations, volunteers, sponsors, upcoming events, and inventory alerts
- **Donation Trends chart** — monthly bar chart of completed donations
- **Volunteer Registrations chart** — monthly bar chart of new volunteer sign-ups
- **Volunteer management** — add, edit, approve, reject, and delete volunteers
- **Donation management** — record, edit, and track donations with status
- **Messages** — view and reply to contact form submissions
- **Events** — create and manage upcoming events with attendance tracking
- **Inventory** — track stock levels with low-stock alerts
- **Sponsorships** — manage child sponsorships and payment statuses
- **Reports** — export PDF reports for donations, volunteers, events, inventory, and sponsorships
- **Notifications** — real-time in-app notification panel
- **Activity log** — recent admin actions feed
- **Dark mode** — toggle between light and dark themes
- **Global search** — search across all data tables

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Auth & Database | [Supabase](https://supabase.com) |
| Charts | [Chart.js 4](https://www.chartjs.org/) |
| Icons | [Font Awesome 6](https://fontawesome.com/) |
| PDF Export | [jsPDF](https://github.com/parallax/jsPDF) |

No build tools or frameworks — runs directly in the browser.

---

## Project Structure

```
orphanage-home/
├── index.html          # Public home page
├── login.html          # Sign-in page
├── signup.html         # Registration page
├── donate.html         # Donation page (auth required)
├── styles.css          # Shared public styles
├── supabase-config.js  # Supabase client setup
├── logo.png            # Brand logo
├── kids.jpg            # Hero image
└── admin/
    ├── admin.html      # Admin dashboard
    ├── admin.css       # Dashboard styles
    └── admin.js        # Dashboard logic
```

---

## Getting Started

### Prerequisites
- A modern browser (Chrome, Firefox, Edge)
- A [Supabase](https://supabase.com) project with the following tables:
  - `users` — columns: `id`, `display_name`, `role`, `total_donated`
  - `donations` — columns: `id`, `user_id`, `user_email`, `amount`, `message`, `created_at`
  - `balances` — columns: `user_id`, `balance`, `updated_at`

### Running locally

Since this is a plain HTML project, just open `index.html` in your browser. No install step needed.

```bash
# Clone the repo
git clone https://github.com/MapokgoleSemoshwe/orphanage-home.git
cd orphanage-home

# Open in browser (Windows)
start index.html
```

Or use the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) VS Code extension for a better local dev experience.

---

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your **Project URL** and **anon public key**
3. Replace the values in `supabase-config.js`, `index.html`, `login.html`, `signup.html`, `donate.html`, and `admin/admin.html`
4. Create the required tables in the Supabase SQL editor
5. To make a user an admin, set their `role` column to `'admin'` in the `users` table

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
4. Push to your branch and open a pull request against


---

## License

This project is for educational and non-profit use. All rights reserved © 2026 Hopeful Hearts Orphanage.
