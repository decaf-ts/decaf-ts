# DECAF-44: for-angular Cron Selector Web Component

**Status:** Completed
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

The component should also integrate cleanly with Angular reactive forms and emit a cron string that can be consumed by downstream scheduling or calendar code.

## 2. Goals

*   [x] Add a standalone `cron-selector` web component in `for-angular` with an Ionic-native UI.
*   [x] Support visual selection of daily schedules with one or more times.
*   [x] Support fixed-interval schedules expressed as every N hours.
*   [x] Support weekly schedules expressed as a time plus a set of weekdays.
*   [x] Emit a raw five-field cron expression for each supported schedule shape.
*   [x] Preserve Angular reactive forms compatibility so the component can be bound with `[(cron)]` or an equivalent form control integration.
*   [x] Keep the component dependency surface limited to Ionic and Angular.

## 3. User Stories / Requirements

*   **US-1:** As a clinician or caregiver, I want to select a medication reminder schedule visually so that I do not need to understand cron syntax.
*   **US-2:** As a user, I want to choose one or more daily reminder times so that recurring doses can be represented directly.
*   **US-3:** As a user, I want to choose an interval such as every 2, 4, 6, 8, or 12 hours so that the reminder matches a common dosing cadence.
*   **US-4:** As a user, I want to choose specific weekdays and a single time so that I can define weekday-only reminders.
*   **US-5:** As a developer, I want the component to emit a raw cron string so that downstream services can keep using cron-based scheduling APIs.
*   **US-6:** As a developer, I want the component to emit semicolon-separated cron expressions for mixed-time schedules so that downstream consumers can keep separate occurrences distinct.
*   **Req-1:** The component must be a standalone Angular web component in the `for-angular` module.
*   **Req-2:** The component must use Ionic-native controls such as `ion-segment`, `ion-select`, `ion-datetime`, `ion-modal`, and `ion-button`.
*   **Req-3:** The component must support Angular reactive forms and emit schedule changes through a cron output contract.
*   **Req-4:** Daily schedules with multiple times must serialize to a valid cron representation. When the selected times share the same minute value, they may be combined into a single cron expression; when they do not, the component must emit multiple cron expressions separated by semicolons.
*   **Req-5:** The component must preserve semicolon-separated cron expressions when a daily schedule cannot be represented by a single five-field expression.
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

### 4.3 Downstream behavior

Downstream consumers may later consume a semicolon-separated cron string such as:

`0 8 * * *;30 20 * * *`

This must be interpreted as two independent schedules, not as one expression. A consumer may then either:

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
| [TASK-253](./tasks/TASK_253.md) | Define the cron-selector contract, serialization rules, and downstream multi-schedule expectations | High | Completed | - |
| [TASK-254](./tasks/TASK_254.md) | Implement the Ionic standalone cron-selector component and reactive-form binding | High | Completed | TASK-253 |
| [TASK-255](./tasks/TASK_255.md) | Add raw cron serialization coverage for daily multi-time output and emitted semicolon-separated expressions | Medium | Completed | TASK-253, TASK-254 |

## 6. Open Questions / Risks

* Resolved: the component exposes both a `ControlValueAccessor` API and a direct `[(cron)]` binding.
* Resolved: daily schedules with mismatched minutes emit multiple cron expressions separated by semicolons.
* Resolved: timezone handling remains the responsibility of downstream consumers, not the picker UI.
* Resolved: weekly mode uses a single time per weekday set.
* Resolved: semicolon-separated schedules are emitted by the picker and interpreted by downstream consumers.

## 7. Results & Artifacts

* `for-angular/src/lib/components/cron-selector/cron-selector.component.ts`
* `for-angular/src/lib/components/cron-selector/cron-selector.component.html`
* `for-angular/src/lib/components/cron-selector/cron-selector.component.scss`
* `for-angular/src/lib/components/cron-selector/cron-selector.component.spec.ts`
* `for-angular/src/app/pages/cron-selector/cron-selector.page.ts`
* `for-angular/src/app/pages/cron-selector/cron-selector.page.html`
* `for-angular/src/app/pages/cron-selector/cron-selector.page.scss`
* `for-angular/src/app/pages/cron-selector/cron-selector.page.spec.ts`
