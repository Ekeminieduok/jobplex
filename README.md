Job Plex
A job discovery and matching platform built to help job seekers find opportunities that fit their skills, experience, and career goals.
Job Plex is also a practical learning project: building a product from authentication and profile management through job ingestion, explainable matching, and administration.
Status: active development. The current focus is signup and Supabase authentication. Email confirmation and callback testing are still in progress. Job API integration, matching, and the global admin dashboard are planned features.

Product vision
The intended user journey is:
1. Create an account using email/password or Google.
2. Complete a profile with skills, experience, and job preferences.
3. Receive ranked opportunities imported from a job provider.
4. Understand why each job matches the profile.
5. Save jobs, apply on the original listing website, and manually track applications.
The backend will import jobs centrally; users will not configure their own job API connections.
User roles
Role	Intended capabilities
Job seeker	Manage a career profile, browse jobs, view matches, save opportunities, and track applications.
Global admin	Manage users, moderate listings, monitor job integrations, configure matching rules, and review audit logs.


Employer accounts and direct employer job posting are outside the initial scope.
Current development scope
- Signup interface with name, email, and password fields.
- Browser validation and password visibility controls.
- Supabase email/password signup and confirmation resend integration code.
- Loading states and request feedback.
- Signup metadata in a server page, with form interactions in a client component.
- Manrope typography and the Job Plex logo.
- Cookie-based Supabase client utilities, session refresh, authentication callback, and an onboarding placeholder as the next authentication implementation pieces.
End-to-end authentication has not yet been verified. Google sign-in remains a placeholder until provider configuration and integration are completed. Profile persistence and role-based administration are not implemented yet.
Technology stack
Technology	Purpose	Version / configuration
Next.js	App Router and application framework	16.4.0
React / React DOM	User interface	19.3.0
TypeScript	Static typing	5.x
Tailwind CSS	Styling	4.x
Supabase	Authentication and planned PostgreSQL backend	@supabase/supabase-js and @supabase/ssr
pnpm	Package management	11.5.0, pinned in package.json
ESLint	Code linting	9.x


The version numbers above reflect the project's supplied package configuration. Use the committed lockfile for exact dependency resolution.
Getting started
Prerequisites
- Node.js compatible with the versions of Next.js and pnpm used by this repository.
- pnpm 11.5.0.
- A Supabase project.
Check your environment:
node --version
pnpm --version
1. Clone and install
Replace the placeholders with this repository's actual URL and directory name:
git clone <repository-url>
cd <repository-directory>
pnpm install
Commit pnpm-lock.yaml and use pnpm consistently for this project.
2. Configure environment variables
Create .env.local in the repository root:
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
Copy the project URL and publishable key from your Supabase project. Never put a Supabase secret key or service_role key in a NEXT_PUBLIC_ variable. Keep .env.local out of Git; a committed .env.example can contain the placeholders above.
3. Configure Supabase authentication
For local development, set the Supabase authentication URL configuration to:
Setting	Value
Site URL	http://localhost:3000
Allowed redirect URL	http://localhost:3000/auth/callback


Keep email confirmation enabled while testing the confirmation flow. The callback route must exchange the returned authorization code for a session before redirecting to onboarding.
Google sign-in requires separate Google OAuth credentials and an enabled Google provider in Supabase. It is not enabled merely by displaying a Google button.
4. Start development
pnpm dev
Open http://localhost:3000/signup.
Restart the development server after changing environment variables.
File organization
The current signup arrangement is:
Path	Responsibility
public/images/jobplexlogo.png	Project logo
src/app/layout.tsx	Root layout, Manrope font, and default metadata
src/app/globals.css	Global styling and Tailwind configuration
src/app/signup/page.tsx	Signup-specific metadata and server page wrapper
src/components/auth/signup-form.tsx	Interactive signup form


Authentication integration uses the following paths; verify these are present when completing setup:
Path	Responsibility
src/lib/supabase/client.ts	Browser Supabase client
src/lib/supabase/server.ts	Server Supabase client with cookie access
src/proxy.ts	Session cookie refresh
src/app/auth/callback/route.ts	Authentication code exchange
src/app/onboarding/page.tsx	Protected onboarding entry point


The signup page remains a Server Component so it can export metadata. The form uses "use client" for state and event handlers. Proxy refreshes sessions; protected server pages and data operations must still verify identity and permissions.
Available commands
Command	Purpose
pnpm dev	Start the development server
pnpm build	Create a production build
pnpm start	Run the production server after building
pnpm lint	Run ESLint


Authentication testing and troubleshooting
Before considering signup complete, verify:
- A new signup appears in Supabase Authentication → Users.
- The confirmation email arrives and its newest link opens in the same browser used for signup.
- Successful confirmation reaches /onboarding.
- An unauthenticated visit to /onboarding redirects to /signup.
- Resend requests show useful loading and error feedback.
Callback returns 404
Check that the handler exists at src/app/auth/callback/route.ts and exports GET. The handler filename is route.ts. If the final URL is /onboarding, check that onboarding's page.tsx exists instead.
Confirmation link is invalid or expired
An otp_expired response indicates that Supabase rejected the email verification link. Request a new confirmation email and use its newest link once. Reusing the callback URL will not generate a fresh authorization code.
Confirmation email does not arrive
Check the resend request's response, the user's confirmation status, spam folders, Auth logs, and the project's SMTP configuration and limits. A successful API response does not prove inbox delivery. Supabase's built-in mail service has restrictive testing limits; review the current documentation and configure custom SMTP for broader use.
Planned matching engine
The first matching engine will use deterministic rules with visible explanations rather than require an AI model.
Factor	Proposed weight
Skills	40%
Target role	20%
Experience	15%
Location / work arrangement	15%
Employment type	10%


Inactive jobs and confirmed violations of a user's hard constraints are excluded first. Each available factor receives a subscore between 0 and 1.
match score = round(100 × sum(available weight × subscore) / sum(available weight))
information coverage = sum(available weights) / sum(all weights)
Missing information is treated as unknown. If no factors can be assessed, no numeric score is produced. The initial proposed minimum coverage for ranked recommendations is 50%.
Scores represent relevance, not a probability of getting hired. The weights and threshold are initial design choices, not validated measures. Personal characteristics such as name, gender, religion, ethnicity, age, and photo will not be matching inputs.
Roadmap
- [ ] Verify signup, confirmation resend, callback, and session behavior.
- [ ] Add login, logout, and password recovery.
- [ ] Configure and connect Google sign-in.
- [ ] Build profile onboarding and persistence with database access policies.
- [ ] Add job browsing and one job API integration.
- [ ] Implement matching with score explanations and information coverage.
- [ ] Add saved jobs and manual application tracking.
- [ ] Build global admin controls and audit logging.
- [ ] Add meaningful authorization, matching, and import tests.
Development principles
Keep the code understandable and build in manageable phases. Validate input on the server as well as in the browser. Enforce user ownership and admin permissions on the server, and enable appropriate Row Level Security policies before exposing application tables. Never derive admin privileges from user-editable signup metadata.
References
- Next.js documentation
- Supabase server-side authentication
- Supabase Google authentication
- Supabase SMTP configuration
- Tailwind CSS documentation
- pnpm documentation