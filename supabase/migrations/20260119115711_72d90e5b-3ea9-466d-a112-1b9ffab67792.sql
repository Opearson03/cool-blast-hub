-- Enable realtime for staff dashboard tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.businesses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.business_subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.waiting_list;