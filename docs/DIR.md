.
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── actions
│   ├── README.md
│   ├── accounts
│   │   ├── create-account.ts
│   │   ├── delete-account.ts
│   │   ├── get-accounts.ts
│   │   ├── get-recent-accounts.ts
│   │   └── update-account.ts
│   ├── activities
│   │   ├── create-activity.ts
│   │   ├── delete-activity.ts
│   │   ├── get-activities.ts
│   │   ├── get-recent-activities.ts
│   │   └── update-activity.ts
│   ├── analytics
│   │   └── get-correlation-analysis.ts
│   ├── analytics-cache
│   │   ├── get-cached-analytics.ts
│   │   └── save-cached-analytics.ts
│   ├── behavior-scores
│   │   ├── calculate-and-save.ts
│   │   ├── get-behavior-scores-by-user.ts
│   │   ├── get-behavior-scores-trend.ts
│   │   └── get-behavior-scores.ts
│   ├── coaching-signals
│   │   ├── generate-and-save.ts
│   │   ├── get-signals.ts
│   │   └── resolve-signal.ts
│   ├── competitor-signals
│   │   ├── create-competitor-signal.ts
│   │   ├── detect-and-save.ts
│   │   └── get-competitor-signals.ts
│   ├── contacts
│   │   ├── create-contact.ts
│   │   ├── delete-contact.ts
│   │   ├── get-contacts.ts
│   │   └── update-contact.ts
│   ├── feedback
│   │   └── create-feedback.ts
│   ├── outcomes
│   │   ├── calculate-and-save.ts
│   │   ├── get-outcomes-by-user.ts
│   │   └── get-outcomes.ts
│   ├── prescriptions
│   │   ├── create-prescription.ts
│   │   ├── delete-prescription.ts
│   │   ├── get-prescriptions.ts
│   │   └── update-prescription.ts
│   ├── recommendations
│   │   └── get-next-best-actions.ts
│   ├── sample-data
│   │   ├── create-sample-accounts.ts
│   │   ├── create-sample-activities.ts
│   │   ├── create-sample-contacts.ts
│   │   └── create-sample-prescriptions.ts
│   └── users
│       ├── get-team-members.ts
│       └── get-user-id-by-clerk-id.ts
├── app
│   ├── (dashboard)
│   │   ├── layout.tsx
│   │   ├── accounts
│   │   │   └── page.tsx
│   │   ├── activities
│   │   │   └── page.tsx
│   │   ├── analysis
│   │   │   └── page.tsx
│   │   ├── dashboard
│   │   │   └── page.tsx
│   │   ├── feedback
│   │   │   └── page.tsx
│   │   ├── growth
│   │   │   └── page.tsx
│   │   ├── manager
│   │   │   └── page.tsx
│   │   └── outcomes
│   │       └── page.tsx
│   ├── api
│   │   └── sync-user
│   │       └── route.ts
│   ├── auth-test
│   │   └── page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── sign-in
│   │   └── [[...sign-in]]
│   │       └── page.tsx
│   ├── sign-up
│   │   └── [[...sign-up]]
│   │       └── page.tsx
│   └── storage-test
│       └── page.tsx
├── components
│   ├── accounts
│   │   ├── account-form.tsx
│   │   ├── account-list.tsx
│   │   └── accounts-client.tsx
│   ├── activities
│   │   ├── activities-client.tsx
│   │   ├── activity-drawer.tsx
│   │   ├── activity-form.tsx
│   │   └── activity-list.tsx
│   ├── analysis
│   │   ├── customer-segmentation.tsx
│   │   ├── hir-growth-scatter.tsx
│   │   ├── prescription-funnel.tsx
│   │   └── volume-quality-heatmap.tsx
│   ├── charts
│   │   └── chart-wrapper.tsx
│   ├── coaching
│   │   └── coaching-signals-list.tsx
│   ├── competitor
│   │   └── competitor-signal-form.tsx
│   ├── contacts
│   │   ├── contact-form.tsx
│   │   └── contact-list.tsx
│   ├── dashboard
│   │   ├── behavior-outcome-map.tsx
│   │   ├── behavior-quality-chart.tsx
│   │   ├── outcome-stat-cards.tsx
│   │   └── sample-data-generator.tsx
│   ├── error-boundary.tsx
│   ├── feedback
│   │   └── feedback-form.tsx
│   ├── growth
│   │   ├── behavior-trend-chart.tsx
│   │   └── outcome-trend-chart.tsx
│   ├── layout
│   │   ├── app-layout.tsx
│   │   ├── header.tsx
│   │   └── sidebar.tsx
│   ├── manager
│   │   ├── competitor-heatmap.tsx
│   │   ├── hospital-risk-map.tsx
│   │   ├── team-behavior-ranking.tsx
│   │   ├── team-goals.tsx
│   │   └── team-risk-list.tsx
│   ├── Navbar.tsx
│   ├── prescriptions
│   │   ├── prescription-form.tsx
│   │   └── prescription-list.tsx
│   ├── providers
│   │   └── sync-user-provider.tsx
│   ├── recommendations
│   │   └── next-best-action.tsx
│   ├── ui
│   │   ├── accordion.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── combobox.tsx
│   │   ├── command.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── popover.tsx
│   │   ├── radio-group.tsx
│   │   ├── select.tsx
│   │   ├── sheet.tsx
│   │   ├── skeleton.tsx
│   │   ├── slider.tsx
│   │   ├── sonner.tsx
│   │   ├── table.tsx
│   │   └── textarea.tsx
│   └── UserProfile.tsx
├── constants
│   ├── activity-types.ts
│   ├── behavior-types.ts
│   ├── competitor-signal-types.ts
│   ├── outcome-types.ts
│   ├── products.ts
│   └── user-roles.ts
├── docs
│   ├── api
│   │   └── [api documentation files]
│   ├── DIR.md
│   ├── product
│   │   └── [product documentation files]
│   └── TODO.md
├── hooks
│   └── use-sync-user.ts
├── lib
│   ├── analytics
│   │   ├── analyze-behavior-outcome-correlation.ts
│   │   ├── calculate-behavior-scores.test.ts
│   │   ├── calculate-behavior-scores.ts
│   │   ├── calculate-conversion-rate.ts
│   │   ├── calculate-field-growth.ts
│   │   ├── calculate-hir.ts
│   │   ├── calculate-prescription-index.ts
│   │   ├── detect-competitor-signals.ts
│   │   ├── generate-coaching-actions.ts
│   │   ├── generate-coaching-signals.ts
│   │   └── recommend-next-action.ts
│   ├── auth
│   │   └── [auth utility files]
│   ├── supabase
│   │   ├── clerk-client.ts
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── service-role.ts
│   ├── supabase.ts
│   ├── utils
│   │   └── [utility files]
│   └── utils.ts
├── scripts
│   ├── README.md
│   └── generate-sample-data.ts
├── supabase
│   ├── config.toml
│   └── migrations
│       ├── 20250101000000_fix_public_schema_permissions.sql
│       ├── 20250102000000_optimize_indexes.sql
│       ├── crm_schema.sql
│       ├── setup_schema.sql
│       └── setup_storage.sql
├── types
│   ├── behavior.types.ts
│   ├── chart.types.ts
│   ├── database.types.ts
│   └── outcome.types.ts
├── components.json
├── eslint.config.mjs
├── middleware.ts
├── next-env.d.ts
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
├── public
│   ├── icons
│   │   ├── icon-192x192.png
│   │   ├── icon-256x256.png
│   │   ├── icon-384x384.png
│   │   └── icon-512x512.png
│   ├── logo.png
│   └── og-image.png
├── tsconfig.json
├── vitest.config.ts
└── vitest.setup.ts
