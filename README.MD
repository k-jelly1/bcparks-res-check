# BC Parks Pass Helper

A lightweight helper for grabbing BC Parks day-use passes.

The project consists of two parts:

- **Backend poller** – continuously checks the BC Parks API for available passes.
- **Tampermonkey userscript** – automatically pre-fills the reservation form once the booking page opens.

> The userscript **does not submit the reservation automatically.** It only fills the form so you can review it and click **Submit** yourself.

---

## Features

- Polls BC Parks availability every 30 seconds
- Detects newly available passes
- Opens the reservation page automatically
- Audible alert when passes become available
- Auto-selects:
  - Visit date
  - Pass type
- Chrome Autofill can complete the contact information
- No automatic booking or submission

---

## Repository Structure

```
backend/
    poll.sh

userscripts/
    bcparks-prefill.user.js
```

---

## Requirements

### Backend

- WSL / Linux
- Bash
- curl
- jq

Install jq if needed:

```bash
sudo apt install jq
```

---

### Browser

- Chrome or Edge
- Tampermonkey extension

---

## Backend

Run:

```bash
./backend/poll.sh -dYYYY-MM-DD
```

Example:

```bash
./backend/poll.sh -d2026-07-24
```

The script will:

- poll every 30 seconds
- alert when passes become available
- play a sound
- open the BC Parks reservation page

Stop with:

```bash
Ctrl + C
```

---

## Userscript Configuration

Edit:

```
userscripts/bcparks-prefill.user.js
```

Configure:

```javascript
const CONFIG = {
    targetDate: "2026-07-24",
    targetPass: "Joffre Lakes - Trail"
};
```

The date here **must match** the date passed to the backend.

---

## Chrome Autofill

Instead of filling contact information with JavaScript, Chrome Autofill is recommended.

Enable:

```
Chrome
→ Settings
→ Autofill and passwords
→ Addresses and more
```

Then save your:

- first name
- last name
- email
- phone number

This is typically faster and more reliable than scripting those fields.

---

## Notes

The backend and userscript are independent.

The backend only:

- checks availability
- opens the reservation page

The userscript only:

- fills the booking form

It does **not** know which date the backend detected, so keep both configured with the same target date.

---

## API

Current endpoint:

```
https://reserve.bcparks.ca/api/reservation?facility=Joffre%20Lakes&park=0363
```

Availability is determined using:

```json
"DAY": {
    "capacity": "Low",
    "max": 4
}
```

A pass is considered available whenever:

```
max > 0
```

rather than checking whether `"capacity"` equals `"Low"`.

---

## Disclaimer

This project is intended only to automate checking for availability and reduce manual form entry.

Users are responsible for complying with BC Parks' Terms of Use and completing their own reservation.