# Security policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | ✅        |

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead:

1. Use GitHub **Security Advisories** → “Report a vulnerability” on this repository, or
2. Contact me privately via my [GitHub profile](https://github.com/aljojoby9).

Include:

- Description of the issue
- Steps to reproduce
- Affected versions
- Potential impact

I aim to acknowledge reports within **72 hours** and will coordinate a fix and disclosure timeline with you.

## Safe usage notes

- Never commit `KRUTRIM_API_KEY` / `KRUTRIM_CLOUD_API_KEY` to source control.
- Prefer server-side usage for production chat routes; do not embed long-lived keys in client bundles.
- Rotate keys in the [Krutrim Cloud console](https://cloud.olakrutrim.com) if leaked.
