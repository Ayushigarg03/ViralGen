# Google Sheets Integration Setup Guide

Follow these steps to connect your **ViralGen AI** campaign logs directly to a live Google Sheet.

---

## Step 1: Create a Google Spreadsheet
1. Open [Google Sheets](https://sheets.google.com).
2. Create a new blank spreadsheet.
3. Save it as **ViralGen AI Ad Content Reports**.

---

## Step 2: Open Apps Script Editor
1. In your Google Spreadsheet, click **Extensions** in the top menu bar.
2. Select **Apps Script**.
3. Delete any default code in the editor (e.g. `function myFunction() { ... }`).

---

## Step 3: Paste the Webhook Code
Copy the code block below and paste it into the editor window:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var json = JSON.parse(e.postData.contents);
  
  // Setup headers if the sheet is empty
  if (sheet.getLastRow() == 0) {
    sheet.appendRow([
      "Campaign ID", "Date Created", "Platform", 
      "Brand Persona", "Brand Brief", "Generated Copy", 
      "Image URL", "Status"
    ]);
    
    // Format header style (Indigo theme matching brand)
    var headerRange = sheet.getRange(1, 1, 1, 8);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#4F46E5");
    headerRange.setFontColor("#FFFFFF");
    headerRange.setHorizontalAlignment("center");
    sheet.setRowHeight(1, 28);
  }
  
  // Handle BATCH Sync (All Campaigns sync)
  if (json.action === "sync_all" && Array.isArray(json.data)) {
    // Clear old data rows (keep header)
    if (sheet.getLastRow() > 1) {
      sheet.deleteRows(2, sheet.getLastRow() - 1);
    }
    
    // Append rows
    for (var i = 0; i < json.data.length; i++) {
      var row = json.data[i];
      sheet.appendRow([
        row.id, 
        row.created_at, 
        row.platform, 
        row.persona, 
        row.brief, 
        row.text_copy, 
        row.image_url, 
        row.status
      ]);
      styleRow(sheet, sheet.getLastRow(), row.status);
    }
    return ContentService.createTextOutput(
      JSON.stringify({ status: "success", count: json.data.length })
    ).setMimeType(ContentService.MimeType.JSON);
  } 
  
  // Handle SINGLE Campaign Sync (Real-time update)
  else {
    sheet.appendRow([
      json.id, 
      json.created_at, 
      json.platform, 
      json.persona, 
      json.brief, 
      json.text_copy, 
      json.image_url, 
      json.status
    ]);
    styleRow(sheet, sheet.getLastRow(), json.status);
    return ContentService.createTextOutput(
      JSON.stringify({ status: "success" })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// Helper to style successful (light green) vs failed (light red) rows
function styleRow(sheet, rowNum, status) {
  var range = sheet.getRange(rowNum, 1, 1, 8);
  if (status === "SUCCESS") {
    range.setBackground("#D1FAE5"); // light mint green
  } else if (status === "FAILED") {
    range.setBackground("#FEE2E2"); // light pastel red
  }
  range.setFontSize(10);
  range.setVerticalAlignment("middle");
}
```

---

## Step 4: Deploy the Web App
1. Click the **Deploy** button (top-right of the Apps Script window) and select **New deployment**.
2. Click the gear icon (Select type) next to "Configuration" and choose **Web app**.
3. Enter a description (e.g. *ViralGen Webhook*).
4. For **Execute as**, select **Me (your_email@gmail.com)**.
5. For **Who has access**, select **Anyone** (this is required so the backend API server can call it without complex OAuth login).
6. Click **Deploy**.
7. Google will prompt you to authorize permissions. Click **Authorize access**, choose your Google Account, click **Advanced**, click **Go to Untitled project (unsafe)**, and select **Allow**.
8. Copy the **Web app URL** (looks like `https://script.google.com/macros/s/AKfycb.../exec`).

---

## Step 5: Configure Backend Environment Variable
Set the copied URL as an environment variable `GOOGLE_SHEET_WEBHOOK_URL` in your backend:

### In Local mode:
Open the environment setup or edit your system environment variable, or simply run:
```powershell
$env:GOOGLE_SHEET_WEBHOOK_URL="your_copied_web_app_url"
```
Or edit `run_local.bat` and add the line:
```batch
set GOOGLE_SHEET_WEBHOOK_URL=your_copied_web_app_url
```

### In Docker Mode:
Open `docker-compose.yml` and add the variable under `api` and `worker` service environment configurations:
```yaml
environment:
  - DATABASE_URL=postgresql://user:pass@postgres:5432/viralgen
  - REDIS_URL=redis://redis:6379/0
  - GOOGLE_SHEET_WEBHOOK_URL=your_copied_web_app_url
```
Then restart the containers!

---

## Step 6: Test the Sync!
1. Start your application suite.
2. Navigate to **History & Logs** in the web app.
3. Click the new **Sync Google Sheets** button.
4. Watch your Google Sheet populate with all past campaign history automatically!
5. Any *new* campaign created hereafter will sync to the next row in real-time instantly.
