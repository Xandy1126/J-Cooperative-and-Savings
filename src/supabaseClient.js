UPDATE public.profiles
SET role = 'admin'
WHERE email = 'xdorate@gmail.com';

-- Verify Admin account
SELECT id, email, role
FROM public.profiles
WHERE email = 'xdorate@gmail.com';
