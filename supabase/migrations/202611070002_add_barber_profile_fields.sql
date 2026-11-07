-- Add roster fields used by the admin Barbers module.
alter table public.barbers
  add column if not exists role text not null default 'Barber',
  add column if not exists availability_status text not null default 'Available';

alter table public.barbers
  drop constraint if exists barbers_availability_status_check;

alter table public.barbers
  add constraint barbers_availability_status_check
  check (availability_status in ('Available', 'Busy', 'On Break', 'Inactive'));

comment on column public.barbers.role is
  'Display role for the barber roster.';
comment on column public.barbers.availability_status is
  'Current roster availability displayed in the admin dashboard.';
