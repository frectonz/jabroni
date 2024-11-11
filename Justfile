test:
    deno test -A
    git restore sample.sqlite3
test-update:
    deno test -A -- --update
    git restore sample.sqlite3
