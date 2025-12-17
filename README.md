<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1yrUOZYlpHAnrQ1YF_1XX1Y2oEQVPofl5

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Attendance Module

### API Expectations
The frontend interacts directly with Supabase `attendance` table.
- **GET Attendance**: Fetches rows for a date range.
- **POST Check-in**: Inserts a new row with `check_in` time.
- **POST Check-out**: Updates the existing row for today with `check_out` time.

**Data Format**:
- `date`: YYYY-MM-DD
- `check_in` / `check_out`: HH:MM:SS (Postgres `time` column)

### Test Steps
1. **View Attendance**: Navigate to the Attendance page. Verify the calendar is on the left and history table on the right.
2. **Check In**: Click the green "CHECK IN" button. Verify the status updates to "Checked In" and a new row appears in the table.
3. **Check Out**: Click "CHECK OUT". Verify the status updates to "Checked Out" and the table reflects the check-out time.
4. **Calendar Navigation**: Click different dates on the calendar. Verify the table updates to show records for that date.
5. **Error Handling**: If the backend rejects the time format, an error banner will appear above the cards.

