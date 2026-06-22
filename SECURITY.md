# Security Policy

## Supported versions

This project is pre-1.0. Security fixes are applied to the latest released
version only.

| Version | Supported |
| ------- | --------- |
| 0.0.x   | ✅        |

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities.

Report privately using GitHub's
[private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
(the **"Report a vulnerability"** button under the repository's *Security* tab),
or email the maintainer at **sayydevara@gmail.com**.

Please include:

- a description of the issue and its impact,
- steps to reproduce (a minimal example helps),
- affected version(s).

We aim to acknowledge reports within a few days and will keep you informed as we
work on a fix. Responsible disclosure is appreciated — please give us reasonable
time to release a fix before any public disclosure.

## Scope notes

`@nakshatra.io/clean-editor` renders ProseMirror/TipTap content. Consumers are
responsible for sanitizing untrusted document content on render (e.g. validating
link/image URL schemes) — see the README and AGENTS.md. Reports about unsanitized
host-provided content are usually integration issues rather than library
vulnerabilities, but we're happy to advise.
