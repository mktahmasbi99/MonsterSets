# Exercise Tracker V1 implementation plan

## 1. Product definition

Exercise Tracker is a private, single-user daily exercise ledger. Its unit of
activity is a set and its container is a calendar day. It does not create or
time workout sessions.

V1 is observational. It records what happened without goals, reminders,
streaks, missed states, success/failure language, or prescribed routines.

### V1 includes

- Repetition-based and duration-based exercises.
- Any number of exercises on one day.
- Timestamped sets with bodyweight or external resistance.
- Daily repetition or duration totals per exercise.
- A searchable and filterable exercise library.
- User-defined exercises and exercise illustrations.
- Historical date navigation and a calendar with activity dots.
- Exercise management: edit, archive, restore, and protected deletion.
- On-demand, daily, and weekly SQLite backups.
- A mobile-first installable web interface backed by the NAS.

### Explicitly deferred

- Goals, notifications, and completion celebrations.
- Charts and statistics.
- Notes and perceived effort.
- Stopwatch or active timers.
- Muscle-group metadata and filters.
- Workout sessions, routines, supersets, and rest timers.
- Offline data storage, queued writes, or automatic write retries.
- User-supplied image uploads.
- In-app database restore.

## 2. Product rules

### Days

- The server-configured IANA timezone is authoritative. The initial timezone is
  `Europe/Warsaw`.
- A set may be created or edited on today or a past date.
- Future dates and future occurrence times on today are rejected by the server.
- A new day is empty. Exercises do not carry forward as zero-valued plans.
- The month calendar shows one dot when a day has at least one saved set. The
  dot does not encode exercise type, volume, or duration.

### Exercise definitions

- Exercise names are trimmed and case-insensitively unique.
- Each exercise has one measurement type: `repetitions` or `duration`.
- Measurement type becomes immutable immediately after the exercise definition
  is saved.
- To represent a differently measured variation, the user creates an exercise
  with a different unique name.
- Built-in and user-created exercises have identical lifecycle rules.
- Renaming an exercise or changing its image updates its presentation across
  all historical dates. Saved set values are unchanged.
- An exercise with no sets may be permanently deleted only after the user types
  `DELETE`.
- An exercise with any set history cannot be permanently deleted. It may be
  archived and later restored.
- Archived exercises remain visible in history but are absent from the normal
  day picker.

### Exercise defaults and previous-set prefilling

- Definition-time defaults include resistance mode, equipment, an optional kg
  value, and a bundled illustration or No picture.
- Definition-time defaults never include repetitions or duration.
- The first set uses the definition-time resistance defaults and requires an
  explicit repetition count or duration.
- Later sets prefill the measurement and resistance values from the
  chronologically preceding set for that exercise. The new set's occurrence
  time still defaults to the current time of day.
- A historical entry never uses a set later than its proposed occurrence time
  as its previous set.
- When the proposed date/time changes, the prefill is recalculated while fields
  the user has already edited remain untouched.
- Editing or deleting the latest set naturally changes which set is considered
  previous next time.

### Resistance and equipment

- Bodyweight is an explicit resistance mode, not numeric `0 kg`.
- The set form provides an explicit `BW` control.
- Submitting `0` in the kg field is a convenience shortcut that switches the
  draft to Bodyweight before it is saved.
- An external-resistance set requires a positive kilogram value and equipment.
- V1 uses kilograms only and accepts either `22.5` or `22,5` as input.
- Stored kg values must use exact decimal representation rather than floating
  point. Integer grams are suitable for storage.
- For weighted bodyweight movements, kg means added external weight, not total
  body mass.
- Dumbbell kg means the weight of each dumbbell.
- Barbell kg means the total loaded bar weight.
- For unilateral or alternating movements, repetitions mean repetitions per
  side. The application stores the entered value and does not double it.

Equipment values:

- Resistance band
- Dumbbell
- Barbell
- Kettlebell
- Cable
- Weight machine
- Weighted vest
- Weight plate
- Ankle weights
- Sandbag
- Other

Selecting Other requires a short custom equipment name.

### Sets

- A repetition set contains a positive whole-number repetition count.
- A duration set contains whole minutes and seconds and is stored as total
  seconds.
- Each set records its occurrence timestamp at finer precision than the visible
  `HH:MM` time.
- A newly created set defaults to the current server-authoritative time. Time is
  editable for manual backfilling.
- Sets within an exercise section are sorted by full occurrence timestamp,
  then creation timestamp, then ID. Earliest is at the top and latest at the
  bottom.
- Displayed set numbers are derived from this order and may change after a time
  edit.
- Exercise sections retain their first-saved order for the day and do not jump
  when later sets are added or times are edited.
- Repetition headings show the sum of repetitions across all resistance values.
- Duration headings show the sum of durations across all resistance values.
- External-resistance rows always display both kg and equipment.
- Saved rows are read-only by default. A pencil opens inline editing and a
  checkmark saves it.
- Every saved row has a trash button. Deletion requires an ordinary confirmation
  naming the exercise and displayed time.
- Deleting a set recalculates totals immediately. Deleting an exercise's final
  set also removes its section from that day.

### Connectivity

- API responses use `Cache-Control: no-store`.
- Exercise data is never stored in local storage, IndexedDB, or a service-worker
  data cache.
- The installable application shell may be cached, but data always comes from
  the server.
- Writes are never retried automatically.
- A failed save remains as a clearly unsaved in-memory draft with a manual Retry
  action. Refreshing or closing the page discards it.

## 3. Initial exercise library

| Name | Measurement | Default resistance | Default equipment | Default kg |
| --- | --- | --- | --- | --- |
| Squats | Repetitions | Bodyweight | — | — |
| Push-ups | Repetitions | Bodyweight | — | — |
| Pull-ups | Repetitions | Bodyweight | — | — |
| Bicep curls | Repetitions | External | Dumbbell | Blank |
| Band pull-aparts | Repetitions | External | Resistance band | Blank |
| Deadlifts | Repetitions | External | Barbell | Blank |
| Plank | Duration | Bodyweight | — | — |
| Hollow-body hold | Duration | Bodyweight | — | — |

The seed insert belongs to one numbered migration and must not run as a recurring
startup reconciliation. The migration transaction and stable internal seed keys
make initial creation idempotent without recreating an exercise the user later
renames, archives, or deletes.

## 4. Illustration library

Use the `@bryllim/workout-guide` catalog, pinned to an exact reviewed version.
It supplies consistent transparent SVG frames and has matching assets for the
initial library.

- Store a nullable external asset key on each exercise.
- Use one representative frame as the compact thumbnail.
- Allow the same picture to be assigned to more than one exercise.
- Provide a searchable picture picker and No picture.
- Do not let the external catalog determine the app's exercise name,
  measurement type, resistance rules, or identity.
- Include visible attribution in Settings/About and a repository third-party
  notice.
- Keep the artwork under its CC BY-SA 4.0 terms and the application code under
  its own software license.

References:

- Catalog: <https://github.com/bryllim/workout-guide>
- Asset license: <https://github.com/bryllim/workout-guide/blob/main/LICENSE-ASSETS>
- Attribution: <https://github.com/bryllim/workout-guide/blob/main/ATTRIBUTION.md>

## 5. Screen specification

### Today / selected day

- Header with previous-day arrow, date label (`Today` when applicable), and
  next-day arrow. Future navigation is disabled.
- Empty state with a prominent Add exercise button.
- The Add exercise button opens the exercise library.
- Exercise sections are always expanded and appear in first-saved order.
- Section header: thumbnail, exercise name, and daily total with its unit.
- Set rows: derived set number, `HH:MM`, reps or duration, and full resistance
  description.
- `Add set` appears once at the bottom of each exercise's rows.
- A new draft row is prefilled according to the previous-set rules and contains
  the explicit Save checkmark.
- Adding an exercise creates only a UI draft section. The section becomes
  durable when its first set saves successfully; otherwise it disappears after
  leaving or refreshing the day.
- Selecting an exercise already present on the selected day shows
  `This exercise is already added to this day.` and leaves the library open.

### Exercise picker

- Search by exercise name.
- Filters: All, Repetitions, Duration.
- Alphabetical results containing thumbnail, name, and measurement type.
- No muscle-group filter and no previous-performance summary.
- New exercise action within the picker.
- Selecting an exercise closes the picker and adds its temporary section to the
  selected day.

### New/edit exercise

- Name.
- Measurement type on creation only; it is read-only after save.
- Picture picker or No picture.
- Default Bodyweight or External resistance.
- For External: equipment, optional default kg, and required custom name when
  equipment is Other.
- Saving a new exercise from the day picker returns to that day with its Add set
  draft ready.

### Calendar

- Monday-first month view.
- One activity dot on any date containing one or more sets.
- Selecting a date opens the standard selected-day ledger.
- No future-day entry creation.

### Exercises

- Active and Archived sections.
- Search and measurement-type filters.
- Edit name, picture, and defaults.
- Archive active exercises with history.
- Restore archived exercises.
- Permanently delete only unused exercises through the typed `DELETE` flow.

### Settings

- Read-only server timezone display.
- On-demand backup creation.
- Backup list grouped into On-demand, Daily, and Weekly.
- Backup download and deliberate deletion.
- Explanation that restore is a server operation in V1.
- Application and illustration attribution.
- PWA install/update controls where supported.

### Primary navigation

- Today
- Calendar
- Exercises
- Settings

### Compact mobile wireframes

Selected day:

```text
              <  Today  >

                         [ + Add exercise ]

[image]  Push-ups                         45 reps
  1      08:12       15 reps       Bodyweight   [edit] [trash]
  2      09:15       15 reps       Bodyweight   [edit] [trash]
  3      10:21       15 reps       Bodyweight   [edit] [trash]
  + Add set

[image]  Squats                           30 reps
  1      08:20       15 reps       Bodyweight   [edit] [trash]
  2      09:36       15 reps       10 kg · Dumbbell
                                             [edit] [trash]
  + Add set

 Today       Calendar       Exercises       Settings
```

Exercise picker:

```text
Add exercise                              [New exercise]
[ Search exercises                                      ]
[ All ]             [ Repetitions ]             [ Duration ]

[image]  Band pull-aparts                     Repetitions
[image]  Bicep curls                          Repetitions
[image]  Deadlifts                            Repetitions
[image]  Hollow-body hold                     Duration
```

Inline repetition draft:

```text
Time       Resistance          Equipment           Reps
[10:21]    [BW] [25 kg]        [Resistance band]   [15] [check]
```

Inline duration draft:

```text
Time       Resistance          Equipment       Duration
[17:31]    [BW] [   kg]        [—]             [0 min] [45 sec] [check]
```

## 6. Proposed database model

Use SQLite with foreign keys, WAL mode, a busy timeout, and numbered idempotent
migrations.

### `schema_migrations`

- `version INTEGER PRIMARY KEY`
- `applied_at TEXT NOT NULL`

### `exercises`

- `id INTEGER PRIMARY KEY`
- `seed_key TEXT UNIQUE NULL`
- `name TEXT NOT NULL`
- `normalized_name TEXT NOT NULL UNIQUE`
- `measurement_type TEXT NOT NULL CHECK (...)`
- `default_resistance_kind TEXT NOT NULL CHECK (...)`
- `default_equipment TEXT NULL CHECK (...)`
- `default_custom_equipment TEXT NULL`
- `default_weight_grams INTEGER NULL`
- `image_key TEXT NULL`
- `archived_at TEXT NULL`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

`normalized_name` is produced in application code using Unicode normalization,
whitespace normalization, and case folding. The API never accepts edits to
`measurement_type`.

### `day_exercises`

- `entry_date TEXT NOT NULL`
- `exercise_id INTEGER NOT NULL`
- `display_order INTEGER NOT NULL`
- `created_at TEXT NOT NULL`
- Primary key: `(entry_date, exercise_id)`
- Unique order per date: `(entry_date, display_order)`

This table is created in the same transaction as an exercise's first set for a
day and deleted when its last set for that day is deleted. It preserves stable
section order without persisting empty exercise sections.

### `exercise_sets`

- `id INTEGER PRIMARY KEY`
- `exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT`
- `entry_date TEXT NOT NULL`
- `occurred_at TEXT NOT NULL`
- `repetitions INTEGER NULL CHECK (repetitions > 0)`
- `duration_seconds INTEGER NULL CHECK (duration_seconds > 0)`
- `resistance_kind TEXT NOT NULL CHECK (...)`
- `weight_grams INTEGER NULL CHECK (weight_grams > 0)`
- `equipment TEXT NULL CHECK (...)`
- `custom_equipment TEXT NULL`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Database checks enforce exactly one of repetitions or duration. Transactional
domain validation additionally verifies that the populated measurement matches
the immutable type on the parent exercise and that resistance fields form a
valid combination.

Indexes:

- `(entry_date, exercise_id, occurred_at, created_at, id)`
- `(exercise_id, occurred_at, created_at, id)`
- `(entry_date)` for month activity queries

### Backup tables

- `backup_runs(category PRIMARY KEY, last_scheduled_date)` for catch-up-safe
  scheduler state.
- `backup_metadata` inside every produced backup with app ID, format version,
  creation time, and category.

## 7. API contract

Use camelCase JSON at the boundary and domain-specific validation errors.

### Configuration and days

- `GET /api/config`
  - Server date, timezone, application version.
- `GET /api/days/{date}`
  - Exercise sections, totals, ordered sets, and stable section order.
- `GET /api/calendar/{yyyy-mm}`
  - Dates containing at least one set.

### Exercises

- `GET /api/exercises?status=active|archived&query=&measurementType=`
- `POST /api/exercises`
- `GET /api/exercises/{exerciseId}`
- `PATCH /api/exercises/{exerciseId}`
  - Never accepts measurement type.
- `POST /api/exercises/{exerciseId}/archive`
- `POST /api/exercises/{exerciseId}/restore`
- `DELETE /api/exercises/{exerciseId}` with `{ "confirmation": "DELETE" }`
- `GET /api/exercises/{exerciseId}/prefill?before={timestamp}`
  - Returns the preceding set or the definition-time defaults.

### Sets

- `POST /api/days/{date}/exercises/{exerciseId}/sets`
- `PATCH /api/sets/{setId}`
- `DELETE /api/sets/{setId}`

The server derives and returns updated day totals and ordering after every write
so the frontend does not maintain a divergent calculation.

### Backups

- `GET /api/backups`
- `POST /api/backups/on-demand`
- `GET /api/backups/{backupId}/download`
- `DELETE /api/backups/{backupId}`

There is no restore API in V1.

## 8. Backup behavior

- Use SQLite's online backup mechanism, not raw copying of an active WAL-backed
  database.
- Run integrity checking on completed backups.
- Create one Daily backup at the local day boundary and retain five Daily files.
- Create one Weekly backup Sunday at `00:00` in the configured timezone and
  retain five Weekly files.
- On-demand backups are never pruned automatically.
- Scheduled work records the last completed logical schedule date, so a brief
  restart around midnight can safely create one catch-up backup without
  creating duplicates.
- Backups live below the mounted data directory and are included in NAS storage
  persistence.
- V1 documents the validated manual server restore procedure but exposes no
  restore button.

## 9. Technical shape

Reuse the proven shape of `web-habit-tracker` without coupling the repositories:

- FastAPI and Pydantic backend.
- SQLite persistence in a dedicated database module.
- React, TypeScript, and Vite frontend.
- React Testing Library and Vitest.
- Playwright desktop and phone coverage.
- FastAPI serves the production frontend bundle.
- Workbox caches only the versioned application shell.
- Docker image plus NAS Compose configuration.
- Tailscale provides private access; the application has no login system.
- GitHub Actions verifies backend, frontend, and E2E tests before publishing a
  GHCR image from the release branch.

Use pinned dependency versions in the new repository rather than copying
`latest` specifications from the existing application.

## 10. Implementation sequence

### Phase 1: Repository and backend foundation

1. Initialize repository metadata, Python package, React/Vite frontend, tests,
   linting, and environment examples.
2. Add timezone configuration and no-store API middleware.
3. Add migration infrastructure, the V1 schema, exact validation helpers, and
   idempotent built-in exercise seeding.
4. Implement exercise lifecycle and set transactions.
5. Implement selected-day grouping, totals, ordering, calendar activity dates,
   and previous-set lookup.

Exit gate: backend tests cover every product invariant before UI work depends on
the API.

### Phase 2: Core mobile logging flow

1. Build the responsive shell and four-tab navigation.
2. Build selected-day navigation and empty state.
3. Build exercise picker, search, measurement filters, and duplicate-day popup.
4. Build repetition and duration Add set rows with prefilling, BW shortcut,
   equipment handling, editable time, and explicit save state.
5. Add read-only rows, inline editing, confirmed deletion, daily totals, and
   stable section ordering.
6. Implement recoverable read errors and visibly unsaved in-memory write drafts.

Exit gate: a phone-sized E2E test records, edits, backfills, and deletes mixed
bodyweight, weighted, repetition, and duration sets without any session concept.

### Phase 3: Library, history, and images

1. Build new/edit exercise forms and immediate type locking.
2. Add active/archive/restore/protected-delete management.
3. Integrate the pinned illustration package, seed mappings, picture picker,
   fallback presentation, and attribution.
4. Build the monthly activity-dot calendar and historical daily ledger.

Exit gate: history remains correct through rename, image change, archive,
restore, chronological backfill, and deletion of a day's final set.

### Phase 4: Backups, PWA, and deployment

1. Implement on-demand backup creation, listing, download, and deletion.
2. Implement daily and weekly scheduling, separate retention, catch-up, and
   integrity checks.
3. Add a shell-only PWA with explicit no-data-cache tests.
4. Add Docker, Compose, persistent volumes, health checks, CI, and GHCR publish.
5. Document local development, Tailscale deployment, backup locations, and the
   manual server restore procedure.

Exit gate: a disposable database survives container replacement, backup
retention is deterministic, and API data is never served from an offline cache.

### Phase 5: Release hardening

1. Accessibility pass: focus management, labels, 44px touch targets, keyboard
   navigation, reduced motion, zoom, and screen-reader state.
2. Actual-phone verification for safe areas, virtual keyboard, rotation, Add to
   Home Screen, reconnect behavior, and day rollover.
3. Performance test with multi-year data and a high set count.
4. Full backup/integrity and migration rehearsal on a copied database.

## 11. Required verification matrix

### Backend

- Case-insensitive and whitespace-normalized name uniqueness.
- Measurement type cannot change after creation.
- Built-in seeding never resurrects renamed, archived, or deleted seeds.
- Exact kg parsing for comma and decimal point.
- `0 kg` becomes Bodyweight; negative weight is rejected.
- External resistance requires equipment, kg, and a custom Other label when
  applicable.
- Repetition and duration payloads cannot be mixed.
- Future date/time writes are rejected at timezone and DST boundaries.
- Same-minute entries remain stably ordered by finer timestamps/tie-breakers.
- Historical prefills never use future sets.
- Day section order survives additional sets and time edits.
- Final-set deletion removes the day/exercise association.
- Used exercise deletion is rejected even with `DELETE`; archive succeeds.
- Calendar reports only non-empty dates.
- Daily and Weekly retention are independently capped at five.
- On-demand backups are not automatically pruned.
- Backup metadata, integrity, catch-up, and duplicate prevention.

### Frontend

- Empty days show no exercise sections.
- Selecting an existing day exercise produces the popup and leaves the picker
  open.
- Temporary zero-set sections disappear after navigation/reload.
- Add set accepts an untouched prefill with one checkmark.
- Repetition, duration, bodyweight, external, and Other-equipment forms expose
  only valid fields.
- Saved rows expose pencil and trash actions without accidental editing.
- Failed writes stay visibly unsaved in memory and are not persisted locally.
- Calendar dots carry accessible labels but no false semantic detail.
- Archived exercises are absent from the picker and intact in history.

### End to end

- Log 15 Bodyweight Push-ups, then accept the prefilled next set.
- Log mixed Bodyweight and 10 kg Squats and verify the combined rep total.
- Log three Plank durations and verify the summed duration heading.
- Backfill out-of-order sets and verify chronological rows plus stable section
  order.
- Create a custom exercise from the picker, save its first set, rename it, and
  verify the historical label.
- Exercise the no-connectivity save failure without any queued replay.
- Create enough scheduled backups to prove category-specific retention.

## 12. Definition of V1 complete

V1 is complete when a user can open an empty day, choose or define an exercise,
record a set in a few seconds, continue adding sets throughout the day, correct
or backfill entries, inspect past days, manage the exercise library, and obtain
reliable backups—without encountering a workout session, goal, reminder,
statistic, or offline synchronization mechanism.
