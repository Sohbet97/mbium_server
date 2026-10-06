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

cd backend
for f in migrations/068_plan_reel_limit.sql migrations/069_comments_parent_id_zero.sql migrations/070_variant_sell_when_out_of_stock.sql; do
  echo "== $f =="
  PGPASSWORD='P@ssword*12345' psql -h localhost -p 5432 -U postgres -d mbium -f "$f" || break
done
****

cd backend
for f in migrations/071_reel_share_count.sql migrations/072_reel_views.sql; do
  echo "== $f =="
  PGPASSWORD='P@ssword*12345' psql -h localhost -p 5432 -U postgres -d mbium -f "$f" || break
done
****

cd backend
for f in migrations/073_turbo_shop_boosts.sql; do
  echo "== $f =="
  PGPASSWORD='P@ssword*12345' psql -h localhost -p 5432 -U postgres -d mbium -f "$f" || break
done
****

cd backend
for f in migrations/074_chat_rooms_shop_product.sql migrations/075_otp_session_phone_purpose.sql; do
  echo "== $f =="
  PGPASSWORD='P@ssword*12345' psql -h localhost -p 5432 -U postgres -d mbium -f "$f" || break
done
****

cd backend
for f in migrations/076_buyer_request_offers.sql migrations/077_buyer_request_attachments.sql; do
  echo "== $f =="
  PGPASSWORD='P@ssword*12345' psql -h localhost -p 5432 -U postgres -d mbium -f "$f" || break
done
****

cd backend
for f in migrations/078_banner_placements_payment.sql migrations/079_ai_settings.sql; do
  echo "== $f =="
  PGPASSWORD='P@ssword*12345' psql -h localhost -p 5432 -U postgres -d mbium -f "$f" || break
done
****

cd backend
for f in migrations/080_category_thumbnail.sql migrations/081_seller_debit.sql migrations/082_tariff_requests.sql migrations/083_guide.sql; do
  echo "== $f =="
  PGPASSWORD='P@ssword*12345' psql -h localhost -p 5432 -U postgres -d mbium -f "$f" || break
done

# After 080: fill thumbnails for existing categories (one-off)
node utils/backfill-category-thumbnails.js

# After 083: new permissions GUIDE_* (364-367) and CHAT_* (368-369) — refresh the Superadmin role,
# then tick them for other roles in Admin → Roles
node -e "require('dotenv').config(); const db=require('./models'); db.sequelize.authenticate().then(()=>require('./seeders/00-superadmin')(db)).then(()=>process.exit(0))"
****
