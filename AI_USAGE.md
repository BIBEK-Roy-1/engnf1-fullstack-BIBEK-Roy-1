# AI Usage

**Project** — TriageSync  
**Tool used** — ChatGPT

## My role

I led the development of TriageSync during the two-day assessment. I turned the requirements into development tasks, made the implementation decisions, and tested the application in Postman. I used ChatGPT mainly as a reference for research, learning, and occasional suggestions.

## How I used ChatGPT

- **Research.** I used ChatGPT to clarify the assessment requirements and explore approaches for ticket triage and resource booking.
- **Learning.** I asked for explanations of idempotent imports and optimistic UI rollback. These helped me understand how to avoid duplicate tickets, preserve an agent’s category changes, and restore the previous UI state if an update fails.
- **Suggestions and supporting materials.** I asked for guidance on testing in Postman, sample ticket records for the benchmark, and help drafting the documentation.

## A suggestion I verified

For the ticket-list benchmark, I tried importing all 600 sample records in a single Postman request. The API returned `request entity too large`, so I switched to smaller requests using the same JSON array format. I then checked the ticket-list response and confirmed that it reported 527 tickets, meeting the benchmark requirement of at least 500.
