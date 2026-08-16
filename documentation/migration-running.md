cd backend
for f in migrations/057_wallet_transactions.sql; do
  echo "== $f =="
  PGPASSWORD='P@ssword*12345' psql -h localhost -p 5432 -U postgres -d mbium -f "$f" || break
done

for f in migrations/058_turbo_boosts.sql; do
  echo "== $f =="
  PGPASSWORD='P@ssword*12345' psql -h localhost -p 5432 -U postgres -d mbium -f "$f" || break
done
****