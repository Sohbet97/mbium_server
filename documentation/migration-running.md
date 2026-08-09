cd backend
for f in migrations/055_seller_wallet.sql; do
  echo "== $f =="
  PGPASSWORD='P@ssword*12345' psql -h localhost -p 5432 -U postgres -d mbium -f "$f" || break
done
****