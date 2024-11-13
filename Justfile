test:
    cd test; deno test -A
    git restore sample.sqlite3

test-update:
    cd test; deno test -A -- --update
    git restore sample.sqlite3

serve:
    cargo run -- sample.sqlite3 serve

generate:
    cargo run -- sample.sqlite3 generate -o ./test/jabroni.ts
