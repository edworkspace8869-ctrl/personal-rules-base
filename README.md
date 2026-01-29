# Personal Rules Base

A minimalist PWA for tracking and managing your personal governance system. Create, pass, and track personal rules with built-in expiration dates and status management.

## Features

✅ **Rule Lifecycle Management**
- Propose new rules
- Pass/reject proposed rules
- Automatic activation on effective date
- Auto-expiration after 30 days maximum
- Archive expired/rejected rules

✅ **Organization**
- Group rules by custom systems (e.g., "Sunday Routine", "Morning Protocol")
- Track both confirmed (purpose) and experimental (hypothesis) rules
- View all active rules at a glance

✅ **PWA Capabilities**
- Install to home screen
- Works offline
- Dark theme optimized for mobile
- Local data storage (IndexedDB)

## Installation

### GitHub Pages Deployment

1. **Fork or clone this repository**
   ```bash
   git clone https://github.com/yourusername/personal-rules-base.git
   cd personal-rules-base
   ```

2. **Enable GitHub Pages**
   - Go to repository Settings
   - Navigate to Pages
   - Set source to `main` branch
   - Your app will be live at `https://yourusername.github.io/personal-rules-base/`

3. **(Optional) Add your personal emblem**
   - Add a `emblem.png` file (192x192px or larger)
   - Uncomment the emblem `<img>` tag in `index.html`:
     ```html
     <div class="emblem">
       <img src="emblem.png" alt="Personal Emblem">
     </div>
     ```

### Local Development

1. **Serve the files locally**
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   ```

2. **Open in browser**
   ```
   http://localhost:8000
   ```

## Usage

### Creating a Rule

1. Click "New Rule" tab
2. Fill in:
   - **Title**: Clear description (e.g., "Prepare 3 lunches every Sunday")
   - **System**: Category/routine (e.g., "Sunday Routine")
   - **Clause Type**: Purpose (confirmed) or Hypothesis (experimental)
   - **Clause Text**: Why this rule exists
   - **Success Metrics**: (For experimental rules) How you'll measure success
   - **Body**: Additional details
3. Click "Create Rule"

### Passing a Rule

1. Go to "Proposed" tab
2. Click "Pass" on a rule
3. Choose effective date:
   - Same as passed date (starts today)
   - Custom date (starts later)
4. Rule will auto-activate on effective date
5. Rule will auto-expire 30 days after effective date

### Managing Rules

- **View Active Rules**: See all currently active rules grouped by system
- **Archive Rules**: Manually archive expired/rejected rules
- **Delete Rules**: Permanently delete archived rules

## Data Storage

All data is stored locally in your browser using IndexedDB:
- ✅ **Privacy**: Your rules never leave your device
- ✅ **Offline**: Works without internet
- ⚠️ **Backup**: Data is tied to your browser - clear browser data = lost rules

### Backup & Restore

Export your data regularly:
```javascript
// Open browser console (F12) and run:
const app = new PersonalRulesApp();
await app.init();
const backup = await app.db.exportData();
console.log(backup); // Copy this JSON
```

To restore:
```javascript
const jsonData = `{...}`; // Paste your backup
await app.db.importData(jsonData);
```

## Rule ID Format

Rules follow the format: `PR[YEAR]-[NUMBER]`
- `PR2026-01` - First rule of 2026
- `PR2026-02` - Second rule of 2026
- `PR2026-01A1` - First amendment to PR2026-01

## File Structure

```
personal-rules-base/
├── index.html          # Main app interface
├── app.js              # Application logic
├── db.js               # IndexedDB database layer
├── service-worker.js   # PWA offline functionality
├── manifest.json       # PWA manifest
├── emblem.png          # (Optional) Your personal emblem
└── README.md           # This file
```

## Browser Compatibility

- Chrome/Edge 80+
- Firefox 75+
- Safari 13.1+
- Mobile browsers with PWA support

## Customization

### Change Colors

Edit the CSS variables in `index.html`:
```css
background: #0a0a0a;  /* Main background */
background: #111;     /* Card background */
background: #e5e5e5;  /* Primary button */
```

### Modify Sunset Period

Currently hardcoded to 30 days max. To change, edit `app.js`:
```javascript
expirationDate.setDate(expirationDate.getDate() + 30); // Change 30 to your preference
```

## License

MIT License - Feel free to fork and customize for your own use!

## Contributing

This is a personal governance tool, but if you have suggestions:
1. Fork the repo
2. Create a feature branch
3. Submit a pull request

## Acknowledgments

Built with vanilla JavaScript, IndexedDB, and PWA APIs. No frameworks, no bloat, just rules.
