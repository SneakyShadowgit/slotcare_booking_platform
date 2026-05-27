# 🏥 SlotCare — Clinic Slot Status Panel

A lightweight, browser-based interface for clinic receptionists to track doctor availability and time slot status. No patient data. No complex dashboards. Just simple slot management.

---

## 🎯 What Is SlotCare?

SlotCare is **not** a clinic management software. It's a **slot-status control panel** that works alongside your clinic's existing software.

Receptionists use it to:
- See which time slots are **Available** or **Filled** at a glance
- Toggle slot status with a **single click**
- Track each doctor's current status (Available / Busy / Delayed / On Leave)

**No patient names. No personal details. Just slot status.**

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **One-Click Toggle** | Click any slot to switch between Available ✓ and Filled ✗ |
| **Multiple Doctors** | Each doctor has their own slot list; switch via tabs or view all together |
| **Doctor Status** | Set each doctor as Available, Busy, Delayed, or On Leave |
| **Bulk Actions** | Mark all slots as Available or Filled with one button |
| **Custom Time Slots** | Add, remove, or edit slot times per doctor |
| **Live Clock** | Real-time date and time display in the top bar |
| **Persistent Data** | All data is saved in browser localStorage — survives page refresh |
| **Responsive** | Works on desktop, tablet, and mobile screens |
| **Zero Setup** | No server, no database, no installation — just open in a browser |

---

## 🚀 Getting Started

### Option 1: Open Directly
1. Download or clone this repository
2. Double-click `index.html`
3. The app opens in your default browser — ready to use

### Option 2: Clone from GitHub
```bash
git clone https://github.com/SneakyShadowgit/slotcare_booking_platform.git
cd slotcare_booking_platform
```
Then open `index.html` in any browser.

> **No build step. No npm install. No server required.**

---

## 📖 How to Use

### First Launch
The app comes pre-loaded with 3 demo doctors (Dr. Sharma, Dr. Patel, Dr. Gupta) and default time slots from 9:00 AM to 5:00 PM.

### Daily Workflow

1. **Open SlotCare** in your browser at the start of the day
2. **Mark doctors on leave** — Click a doctor's status badge → select "On Leave" (their slots grey out)
3. **As patients arrive** — Click the corresponding slot card to mark it as **Filled**
4. **If a patient cancels** — Click the same slot again to toggle it back to **Available**
5. **Doctor running late?** — Click their status badge → select "Delayed"

### Managing Doctors
- Click the **⚙ Settings** icon in the top bar
- **Add** new doctors with name and specialty
- **Remove** doctors who have left the clinic
- **Edit default time slots** for new doctors

### Editing Slots for a Specific Doctor
- Click **✏ Edit Slots** next to any doctor
- Add or remove individual time slots

---

## 🗂️ Project Structure

```
slotcare/
├── index.html     # Main HTML — layout, modals, structure
├── style.css      # Complete CSS design system
├── app.js         # Application logic, state management, persistence
└── README.md      # This file
```

---

## 🛠️ Tech Stack

- **HTML5** — Semantic structure
- **CSS3** — Custom properties, grid layout, animations
- **Vanilla JavaScript** — No frameworks, no dependencies
- **localStorage** — Browser-based data persistence
- **Google Fonts** — Inter typeface

---

## 🎨 Design Principles

- **Minimal clicks** — Every action is one click
- **Color-coded status** — Green = Available, Red = Filled
- **No training needed** — Interface is self-explanatory
- **No patient data** — Privacy by design
- **Works offline** — No internet required after first load (fonts cached)

---

## 📌 Important Notes

- All data is stored **locally in your browser** (localStorage). Clearing browser data will reset the app.
- This is a **frontend-only** application. There is no backend server or database.
- To start fresh, clear your browser's localStorage or open the app in an incognito window.

---

## 📄 License

This project is open source. Feel free to use, modify, and distribute.
