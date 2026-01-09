# NFL Playoff Pick'em Setup Guide

## ✅ Completed Changes

Your NFL Pick'em website now fully supports playoff picks with automatic tiebreaker assignment to the last game of each week!

### Database Changes
- Added `is_tiebreaker` column to the `games` table
- Migration file: `migrations/0004_bouncy_radioactive_man.sql`
- Migration has been applied to your database

### Backend Updates
1. **Sync Logic** - Automatically marks the last game chronologically as the tiebreaker
2. **Scoring Logic** - Uses `isTiebreaker` instead of `isMondayNight` for tiebreaker calculations
3. **Admin Panel** - Added checkbox to manually set/unset tiebreaker games

### Frontend Updates
1. **Homepage** - Now shows playoff weeks 19-22 with labels:
   - Week 19: Wild Card
   - Week 20: Divisional
   - Week 21: Conference
   - Week 22: Super Bowl
2. **Picks Page** - Updated tiebreaker label from "Monday Night Tiebreaker" to "Tiebreaker (total points in last game)"
3. **Game Cards** - Tiebreaker games are highlighted with a gray background

## 📋 Current Playoff Games

### Week 19 - Wild Card Round (Complete)
All 6 games added with final scores. Tiebreaker: Rams vs Vikings (Monday night)

### Week 20 - Divisional Round (Jan 18-19, 2025)
- Chiefs vs Texans (Saturday 4:30 PM ET)
- Lions vs Commanders (Saturday 8:15 PM ET)
- Eagles vs Rams (Sunday 3:00 PM ET)
- **Bills vs Ravens (Sunday 6:30 PM ET)** - TIEBREAKER

### Week 21 - Conference Championships (Jan 26, 2025)
- TBD vs TBD (Sunday 3:00 PM ET - NFC)
- **TBD vs TBD (Sunday 6:30 PM ET - AFC)** - TIEBREAKER

### Week 22 - Super Bowl (Feb 9, 2025)
- **TBD vs TBD (Sunday 6:30 PM ET)** - TIEBREAKER

## 🔧 Updating Playoff Games

### Method 1: Using the Script (Recommended)
```bash
# To update scores or add new games, edit scripts/add-playoff-games.ts
# Then run:
POSTGRES_URL="<your-connection-string>" npx tsx scripts/add-playoff-games.ts
```

### Method 2: Via Admin Interface
1. Navigate to `/admin/games` (requires authentication)
2. Select season: 2026
3. Select week: 19, 20, 21, or 22
4. Edit games and check the "Tiebreaker Game" checkbox for the last game

### Method 3: Re-sync from API (if available)
```bash
curl -X POST http://localhost:3000/api/sync/week \
  -H "Content-Type: application/json" \
  -d '{"season":2026,"week":19}'
```

## 📝 Notes

### Updating Team Names for Conference Championships and Super Bowl
After the Divisional Round completes (Jan 19), you'll need to update weeks 21 and 22:

1. **Option A - Use the script:**
   - Edit `scripts/add-playoff-games.ts`
   - Update the "TBD" team names with actual teams
   - Run the script again (it will update existing games)

2. **Option B - Use admin panel:**
   - Go to `/admin/games`
   - Select season 2026, week 21 or 22
   - Edit each game and update team names

### Tiebreaker Logic
- The system automatically marks the **last game chronologically** of each week as the tiebreaker
- Users guess the total combined points of that game
- Ties are broken by the closest guess (smallest absolute difference)
- The tiebreaker field name is still `mnfTotalPointsGuess` in the database (for backward compatibility) but displays as "Tiebreaker" in the UI

### Week Numbering
- Regular Season: Weeks 1-18
- Wild Card: Week 19
- Divisional: Week 20
- Conference: Week 21
- Super Bowl: Week 22

## 🚀 Testing

Visit these URLs to verify everything works:
- Homepage with playoff weeks: http://localhost:3000
- Wild Card picks: http://localhost:3000/week/2026/19
- Divisional picks: http://localhost:3000/week/2026/20
- Conference picks: http://localhost:3000/week/2026/21
- Super Bowl picks: http://localhost:3000/week/2026/22

## 📂 Key Files Changed

- `db/schema.ts` - Added `isTiebreaker` field
- `app/api/sync/week/route.ts` - Auto-assigns tiebreaker to last game
- `lib/scoring.ts` - Uses `isTiebreaker` for scoring
- `lib/server/scoresSync.ts` - Syncs tiebreaker field
- `app/page.tsx` - Shows playoff weeks
- `app/week/[season]/[week]/picks-client.tsx` - Updated UI labels
- `app/admin/games/GamesEditor.tsx` - Admin checkbox for tiebreaker
- `app/admin/games/actions.ts` - Saves tiebreaker field
- `scripts/add-playoff-games.ts` - Manual game addition script

Enjoy your playoff pick'em! 🏈
