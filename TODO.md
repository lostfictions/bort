<!-- prettier-ignore-start -->

- update libs

- migrate to pnpm => dockerfile too

- migrate to prisma/sqlite

- migrate to "tsx" for transpilation/dev?

=================

- rewrite markov => better tokenization, handle start/end for greater coherency, better handling of punctuation

- reinstate rhyming








//////////

- api for editing a posted message

  - automatically post a placeholder if command takes more than X seconds

  - self-destructing messages

- better cli with ~~blessed or~~ ink?

//////////

- drop `debug`? use pino or something else that reports to sentry?

//////////

=====

- soundboard (audio concepts!?)

- reinstate radio command for discord

=====

conversation -- reactions, replying yes/no

=====

concepts:
-- bort set ==> should give message about replacement
-- bort [concept] +/-/++ not working

shuffle should take plain list in addition to concepts

list timers

time parsing:
-- times of day ("board games night in two weeks")

improve help text

---

- cleanup messages? (eg. confirmations will disappear after 10 seconds; poor
  man's emulation of slack bot messages only visible to the user who invoked the
  command)

- undo!

---

- dynamically import command list; make configurable via env vars
- allow commands to be automatically disabled if eg. api keys are missing

---




<!-- prettier-ignore-end -->
