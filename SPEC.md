# Choma Finder: Version 1 spec (for approval)

**One line:** A simple directory where people find a nearby food vendor (roast chicken, goat, pork, local dishes), call them, and arrange delivery by phone.

The name "Choma Finder" is a working title and can change.

## Scope of version 1
- One launch area (town or neighbourhood), English only.
- Opened from a link (shared on WhatsApp). No app store, no download.
- No orders and no payments inside the app. The call is the transaction.

## Customers (no sign-up)
1. Open the link and pick an area from a list.
2. Optionally tap a food filter: chicken, goat, pork, beef, fish, local dishes.
3. See a list of vendors. Each card shows: name, area, what they sell, a short note with prices, a "Delivers" badge, and the phone number.
4. Tap **Call** (the number is also shown and can be copied).
- Vendors who switched on "Available today" appear first. Featured vendors appear above those, clearly labelled "Featured".
- A footer line: "We only connect you. Delivery and food quality are between you and the vendor."

## Vendors
- Sign up with a phone number and a code sent by SMS (fallback if SMS cost is a problem: you approve each listing by hand).
- Listing fields: business name, phone number, area (from the list), what they sell (tick boxes), price note (short text, 280 characters), delivers (yes or no).
- One big **Available today** switch. It resets to off every morning, so old listings do not mislead customers.
- Edit or remove their own listing.

## You (admin)
- Add and edit the area list.
- Remove or hide any listing.
- Mark a vendor **Featured** with an end date. Limit: 3 featured per area.

## Money
- Listing is free for the first 2 to 3 months to build up vendors and customers.
- Then one paid product: the Featured slot, per area, per month.
- Vendors pay you by mobile money and you switch Featured on by hand. No payment automation in version 1.

## Not in version 1
Photos, opening hours, ratings and reviews, customer accounts, GPS and distance sorting, in-app payments, extra languages, automatic subscriptions.

## What changes from the rough prototype
- Area becomes a fixed list instead of free typing.
- Add the "Available today" switch and daily reset.
- Add phone-code vendor sign-up, replacing open listing.
- Add the admin controls and the Featured slot.
- Add the disclaimer line.

## Things I need from you before building
1. The launch area, and the list of neighbourhoods or sub-areas inside it.
2. Approval for SMS codes (small cost per message) or manual approval instead.
3. Approval of the name "Choma Finder", or your own.

## Simple measures of success
- 20 to 30 vendors listed in the launch area.
- Number of Call button taps per week (counted by the app).
