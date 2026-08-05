# DECAF-44: for-angular Cron Selector Web Component

**Status:** Proposed
**Priority:** High
**Owner:** for-angular / Frontend

## 1. Overview

Add a new standalone Ionic web component in `for-angular` that lets users select a medication-style cron schedule visually instead of typing raw cron by hand.

The component should intentionally support a constrained scheduling model rather than a full system-administrator cron editor. That keeps the UI simpler, reduces invalid combinations, and matches the scheduling patterns usually needed for medication reminders:

* daily at one or more times
* every N hours
* selected weekdays
* a raw five-field cron output for downstream systems

The recommended implementation is a small Ionic-native component built with `ion-segment`, `ion-select`, `ion-datetime`, and related Ionic controls only. It must not introduce a Material or Bootstrap dependency.

The component should also integrate cleanly with Angular reactive forms and emit a cron string that can be consumed by the existing calendar/download flow.

## 2. Goals

*   [ ] Add a standalone `cron-selector` web component in `for-angular` with an Ionic-native UI.
*   [ ] Support visual selection of daily schedules with one or more times.
*   [ ] Support fixed-interval schedules expressed as every N hours.
*   [ ] Support weekly schedules expressed as a time plus a set of weekdays.
*   [ ] Emit a raw five-field cron expression for each supported schedule shape.
*   [ ] Preserve Angular reactive forms compatibility so the component can be bound with `[(cron)]` or an equivalent form control integration.
*   [ ] Extend the calendar service so semicolon-separated cron expressions are treated as multiple schedules instead of a single invalid combination.
*   [ ] Keep the component dependency surface limited to Ionic and Angular.

## 3. User Stories / Requirements

*   **US-1:** As a clinician or caregiver, I want to select a medication reminder schedule visually so that I do not need to understand cron syntax.
*   **US-2:** As a user, I want to choose one or more daily reminder times so that recurring doses can be represented directly.
*   **US-3:** As a user, I want to choose an interval such as every 2, 4, 6, 8, or 12 hours so that the reminder matches a common dosing cadence.
*   **US-4:** As a user, I want to choose specific weekdays and a single time so that I can define weekday-only reminders.
*   **US-5:** As a developer, I want the component to emit a raw cron string so that downstream services can keep using cron-based scheduling APIs.
*   **US-6:** As a developer, I want the calendar service to handle multiple semicolon-separated cron expressions so that mixed-time schedules do not collapse into an incorrect Cartesian product of hours and minutes.
*   **Req-1:** The component must be a standalone Angular web component in the `for-angular` module.
*   **Req-2:** The component must use Ionic-native controls such as `ion-segment`, `ion-select`, `ion-datetime`, `ion-modal`, and `ion-button`.
*   **Req-3:** The component must support Angular reactive forms and emit schedule changes through a cron output contract.
*   **Req-4:** Daily schedules with multiple times must serialize to a valid cron representation. When the selected times share the same minute value, they may be combined into a single cron expression; when they do not, the component must emit multiple cron expressions separated by semicolons.
*   **Req-5:** The calendar service must treat semicolon-separated cron expressions as separate schedules and either create multiple `VEVENT` entries or combine their computed occurrences into `RDATE` values.
*   **Req-6:** The implementation must avoid Material and Bootstrap dependencies.
*   **Req-7:** The component must not silently produce invalid cron combinations when the user selects times that cannot be represented by a single five-field expression.

## 4. Architecture & Design

### 4.1 Component shape

Implement a standalone Ionic component in `for-angular` that exposes a small, opinionated schedule editor rather than a generic cron builder.

Suggested interaction model:

* a segmented control for `daily`, `hourly`, and `weekly`
* one or more `ion-datetime` time pickers for the daily mode
* an `ion-select` for fixed hourly intervals
* a time picker plus weekday toggles for weekly mode
* a generated cron preview for the final emitted value

The component should be easy to bind from parent forms, either as a two-way bound property or as a custom value accessor if that is more consistent with the existing `for-angular` form patterns.

### 4.2 Cron serialization

The serialization contract should stay intentionally narrow:

* **Daily:** emit one cron expression when all times share the same minute value, otherwise emit multiple five-field expressions joined by semicolons.
* **Hourly:** emit `0 */N * * *` for the selected interval.
* **Weekly:** emit `<minute> <hour> * * <weekday-list>` using the selected weekdays.
* **Raw output:** keep the final value as a plain cron string so existing calendar code can reuse it.

The spec should prefer predictable output over trying to normalize every possible cron shape into a single expression.

### 4.3 Calendar service behavior

The existing calendar/download service should be updated so it can consume a semicolon-separated cron string such as:

`0 8 * * *;30 20 * * *`

This must be interpreted as two independent schedules, not as one expression. The service should then either:

* produce multiple `VEVENT` entries, one per schedule, or
* calculate all occurrences and merge them into `RDATE` values when the target calendar format benefits from that representation.

The important requirement is that multiple times remain multiple schedules rather than becoming an unintended time grid.

### 4.4 Suggested file layout

```text
for-angular/
  src/
    app/
      components/
        cron-selector/
          cron-selector.component.ts
          cron-selector.component.html
          cron-selector.component.scss
  tests/
    cron-selector/
      cron-selector.component.spec.ts
```

## 5. Tasks Breakdown

This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID | Task Name | Priority | Status | Dependencies |
|:--|:--|:--|:--|:--|
| [TASK-253](./tasks/TASK_253.md) | Define the cron-selector contract, serialization rules, and calendar-service multi-schedule requirements | High | Pending | - |
| [TASK-254](./tasks/TASK_254.md) | Implement the Ionic standalone cron-selector component and reactive-form binding | High | Pending | TASK-253 |
| [TASK-255](./tasks/TASK_255.md) | Update the calendar service for semicolon-separated cron expressions and add verification coverage | Medium | Pending | TASK-253, TASK-254 |

## 6. Open Questions / Risks

* Should the component expose a `ControlValueAccessor` API, a direct `[(cron)]` binding, or both?
* Should daily schedules with multiple different minutes always emit multiple cron expressions, or should the UI force a single-minute cadence for compactness?
* Do we need timezone handling inside the component, or should timezone remain the responsibility of the calendar service?
* Should the weekly mode allow multiple times per day, or only a single time per weekday?
* If the calendar service receives semicolon-separated schedules, should it prefer multiple `VEVENT` entries by default and reserve `RDATE` for a later optimization?

## 7. Results & Artifacts

Pending implementation.
