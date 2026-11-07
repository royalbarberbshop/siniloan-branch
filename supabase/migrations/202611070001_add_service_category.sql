-- Add service categories used by the Services & Pricing admin screen.
-- Safe to run once on the existing Royal Barber Shop database.
alter table public.services
  add column if not exists category text not null default 'Other';

comment on column public.services.category is
  'Admin catalog grouping: Haircut, Grooming, Package, or Other.';
