# TriageSync Solution

## Part A — Architecture and ticket import trace

```text
[React + Vite]
  |-- POST /api/tickets/import ---------+
  |-- GET /api/tickets and /api/stats --+
  |-- PATCH /api/tickets/:id -----------+
                                        v
[Express routes] -> [Auth middleware] -> [Controllers]
                                              |
                                              v
                                        [Service logic]
                                              |
                                              v
                                        [Mongoose models]
                                              |
                                              v
                                        [MongoDB Atlas]
```

The trace below uses API routes and component responsibilities. Add the exact import, listing, stats, and React function names from the final checkout before submission.

| Step | Function or responsibility | What happens |
| --- | --- | --- |
| 1 | React queue import handler | The Re-Import Feed action sends a JSON body with a `tickets` array to `POST /api/tickets/import`. Each entry supplies `externalId`, `subject`, and `body`. |
| 2 | Express authentication and import controller | The route authenticates the request and passes the feed to the import service. The API returns import, update, and override-skip counts along with the total. |
| 3 | Import validation and classifier | The service validates the feed and classifies subject and body deterministically. For example, “My package has not arrived” maps to `DELIVERY` with `HIGH` priority. |
| 4 | Persistence by `externalId` | A new ticket is stored with its original `autoCategory` and its current `category`. An existing ticket follows the re-import rules in Part B. |
| 5 | Ticket list and stats handlers | `GET /api/tickets` returns the paginated queue. Status, category, priority, and literal text search combine with AND. `GET /api/stats` returns the totals and model agreement rate. |
| 6 | React queue and stats strip | The queue displays the refreshed tickets and stats. Agent edits appear optimistically. A rejected edit restores the previous state and shows an error. |

A ticket qualifies as reviewed when an agent changes its category or moves its status from `OPEN` to another status. An import, a no-op edit, a priority-only edit, or an assignee-only edit does not qualify on its own. The review endpoint records one audit event per changed category, priority, status, or assignee. Each event stores the previous and new values and the actor from `X-Agent` or the signed-in user’s email.

## Part B — Booking concurrency and human override protection

### Booking concurrency

In `booking.service.js`, `createBooking` validates the time range, purpose, and IDs, then opens a Mongoose session and runs the booking operation inside `session.withTransaction`.

1. The transaction increments `bookingLockVersion` on the active resource. Requests for the same resource contend on that document.
2. The transaction also increments `bookingLockVersion` on the user. This protects the three-booking limit when one user books different resources concurrently.
3. Within the same session, `hasBookingOverlap` searches for `PENDING` or `APPROVED` bookings where `existing.startTime < requested.endTime` and `existing.endTime > requested.startTime`. The strict comparisons allow back-to-back bookings.
4. The service checks the user's future active booking count, then inserts the new `PENDING` booking in the same transaction. It ends the session when the operation finishes.

If a concurrent transaction encounters a transient write conflict, the transaction helper can retry it. After the winning transaction commits, the retried overlap query sees the occupied slot and returns a conflict. For ten valid requests to an initially free slot, the expected result is one `201` and nine `409` responses.

### Import idempotency and human overrides

The unique `externalId` identifies a ticket across repeated feeds. For a new ID, classify the text and store the prediction in both `autoCategory` and `category`. For an existing ID, update the subject or body if it changed. Keep the original `autoCategory` available for agreement statistics.

If `isHumanOverride` is false, re-import may refresh the current classification. If an agent changes the category, the review endpoint sets `isHumanOverride` to true and appends a category audit event. Subsequent imports may refresh the ticket text while preserving the agent’s category. Review fields such as status and assignee remain with the existing ticket. Repeating the feed preserves a single ticket per external ID.

## Part C — Measure first, then optimize

**Endpoint** `GET /api/tickets?limit=100`

The Postman request returned a page size of 100 and reported 527 tickets in total, meeting the assessment’s 500-ticket minimum.

| Metric | Before optimization | After optimization |
| --- | --- | --- |
| Dataset size | 527 tickets | 527 tickets |
| Postman response time | Approximately 300–330 ms | 250-280 |
| Midpoint of reported range | 305 ms | 268 |
