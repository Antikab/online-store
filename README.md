# online-store

## Supabase configuration

This project now uses [Supabase](https://supabase.com/) for authentication, storage and realtime data instead of Firebase.

Create a project in Supabase and provide the following environment variables when running locally:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

The database should contain tables that mirror the previous Firebase data:

- `products`: catalogue items (arrays stored as JSON/`text[]`).
- `coupons`: available promo codes.
- `user_coupons`: selected coupon per user (`user_id` unique).
- `wishlists`: wishlist rows (`user_id`, `product_id`).
- `cart_items`: shopping cart rows (`id`, `user_id`, `product_id`, ...).
- `orders`: checkout history (`user_id`, delivery JSON, amounts JSON, items JSON array).
- `profiles`: optional profile metadata for each Supabase user.

Row-level security policies should allow public read for catalogue tables and user-based access (`auth.uid() = user_id`) for personal data tables.
