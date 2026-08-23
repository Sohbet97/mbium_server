cd backend
for f in migrations/059_reel_moderation.sql migrations/060_reel_likes.sql migrations/061_shop_follows.sql migrations/062_gift_media_type.sql migrations/063_gift_creators.sql migrations/064_gift_types.sql migrations/065_reel_gifts.sql; do
  echo "== $f =="
  PGPASSWORD='P@ssword*12345' psql -h localhost -p 5432 -U postgres -d mbium -f "$f" || break
done
****

cd backend
for f in migrations/066_product_price_tiers.sql; do
  echo "== $f =="
  PGPASSWORD='P@ssword*12345' psql -h localhost -p 5432 -U postgres -d mbium -f "$f" || break
done
****

cd backend
for f in migrations/067_colors.sql; do
  echo "== $f =="
  PGPASSWORD='P@ssword*12345' psql -h localhost -p 5432 -U postgres -d mbium -f "$f" || break
done
****