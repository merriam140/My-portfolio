# My Portfolio Website

This is my personal portfolio website hosted on GitHub Pages.

## Live Website
 https://merriam140.github.io/My-portfolio/ 

## Project Structure
- `index.html` – Main page of the website
- `style.css` – Styling for the website
- `script.js` – Optional JavaScript for interactivity (if included)

## How to View Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/merriam140/merriam140.github.io.git


## Optional account sign-in / registration

The main portfolio remains public. The `auth.html` page adds email/password registration, sign-in, sign-out, and password-reset requests using Supabase Auth. Authentication will not work until you connect your own Supabase project.

### Setup

1. Create a project in [Supabase](https://supabase.com/).
2. In the Supabase dashboard, open **Project Settings → API** (the API keys page in some dashboard versions). Copy the **Project URL** and the **anon/public** or **publishable** key.
3. Edit `supabase-config.js` and replace `https://YOUR-PROJECT.supabase.co` and `YOUR-ANON-KEY` with those values.
4. In Supabase **Authentication → URL Configuration**, add the deployed portfolio URL `https://merriam140.github.io/My-portfolio/` and the auth page URL `https://merriam140.github.io/My-portfolio/auth.html` to the allowed redirect URLs. Set the site URL to the portfolio URL.
5. In Supabase **Authentication → Providers → Email**, choose whether to require email confirmation. If enabled, set up email delivery and test the confirmation link.
6. Commit the configuration change and wait for GitHub Pages to redeploy. Open `https://merriam140.github.io/My-portfolio/auth.html` to test registration and sign-in.

### Security notes

- Only use the public anon/publishable key in this static website. **Never** put a Supabase `service_role` key or database password in GitHub.
- Keep Row Level Security (RLS) enabled for any database tables you add, and write policies that restrict access appropriately.
- This adds user authentication, but the portfolio stays public by design. It does not make files in this public GitHub repository private, and it does not protect arbitrary static files. For private user data, enforce authorization with Supabase RLS or a trusted server.
