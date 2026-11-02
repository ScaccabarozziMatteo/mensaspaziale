# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.1] - 2026-11-02

### Added

- Winter 2026 menu data.
- Menu-cycle anchor date/week configuration and tests for the four-week rotation.
- Security headers for static hosts via `public/_headers`.
- Unit tests for menu loading, cache handling, analytics, and Appwrite row mapping.

### Changed

- Upgraded to Angular 22.2.
- Menu cache entries now expire at local midnight instead of being reused on later days.
- Expired `menu-*` cache entries are pruned at startup, and malformed or legacy entries are discarded.
- Appwrite authentication is fully disabled, session lifetime is 24 hours, and password/session protections are enabled.
- Appwrite menu tables are public read-only, and the checked-in schema now matches production.
- Appwrite client configuration is read from `src/environment/environment.ts` instead of bundling the full project config.
- Unit tests now run on Angular's Vitest runner; Karma, Jasmine, and related dependencies were removed.
- Removed the unused `firebase` dependency.
- Removed gelato from the menu.

### Fixed

- Prevented stale menu data from being served after the menu changes.
- Corrected Appwrite table database IDs.
- Corrected the production `dist` output path.

### Security

- Added Content-Security-Policy and `Referrer-Policy` meta tags.
- Disabled unused Appwrite authentication methods.
- Added CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` headers for hosts that support the `_headers` convention.
- `npm audit` now reports 0 vulnerabilities.

## [1.3.0] - 2026-09-29

### Added

- Plate alternatives.
- Shooting stars animation.

### Fixed

- Day navigation.

## [1.2.0] - 2026-08-01

### Added

- Pokè menu support.
- Swipe hint on mobile.

## [1.1.0] - 2026-07-14

### Added

- Analytics tracking.
