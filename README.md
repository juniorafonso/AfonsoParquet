# Afonso Parquet

Website vitrine bilingue (FR/EN) pour Afonso Parquet — spécialiste de la rénovation de sols en parquet à Genève et Suisse romande.

## Services

- Ponçage de parquet
- Pose de parquet
- Pose de plinthe
- Réparation
- Vitrification

## Fonctionnalités

- Site vitrine bilingue FR/EN (prefixe de path `/fr`, `/en`)
- Formulaire de devis en 2 étapes avec upload de photos/vidéos
- Painel administrateur pour gérer les demandes de devis et le portfolio
- SEO optimisé pour Genève et Suisse romande
- Intégration GA4 + Meta Pixel avec consentement de cookies
- Docker + GitHub Actions CI/CD

## Développement local

### Prérequis

- Node.js >= 20
- npm

### Installation

```bash
npm install
```

### Configuration

Copiez `.env.example` vers `.env` et configurez les variables:

```bash
cp .env.example .env
```

Variables importantes:
- `SESSION_SECRET`: générer une clé forte aléatoire
- `ADMIN_USERNAME` / `ADMIN_PASSWORD`: utilisés uniquement pour créer l'admin initial
- SMTP: configurer plus tard pour l'envoi d'emails
- Analytics/Turnstile: configurer plus tard (optionnel)

### Lancer le serveur

```bash
npm start
```

Le site sera disponible sur `http://localhost:3000`

En développement avec auto-reload:

```bash
npm run dev
```

### Configuration Email (Optionnel)

Pour activer l'envoi d'emails (notifications admin + confirmation client):

1. Configurez les variables SMTP dans `.env`:
```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
SMTP_FROM_NAME=Afonso Parquet
SMTP_FROM_EMAIL=contact@afonsoparquet.ch
ADMIN_EMAIL=admin@afonsoparquet.ch
```

2. Redémarrez le serveur

**Note:** Si SMTP n'est pas configuré, le système fonctionnera normalement mais sans envoi d'emails (graceful degradation avec warning dans les logs).

**Templates disponibles:**
- Admin notification (FR/EN): notification avec détails du devis + lien vers admin panel
- Client confirmation (FR/EN): email de confirmation avec promesse de réponse sous 24h

## Déploiement (Docker + Dockge)

### Prérequis sur le serveur

- Docker + Dockge
- Reverse proxy (Traefik / Nginx Proxy Manager) configuré avec SSL pour `afonsoparquet.ch`

### Pull de l'image

L'image Docker est automatiquement buildée et publiée sur GitHub Container Registry (GHCR) à chaque push sur `main`.

Dans Dockge, créez une nouvelle stack avec le `docker-compose.yml` (ajustez les variables d'environnement):

```yaml
version: '3.8'
services:
  afonso-parquet:
    image: ghcr.io/[votre-user]/afonso-parquet:latest
    container_name: afonso-parquet
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3000
      - BASE_URL=https://afonsoparquet.ch
      - SESSION_SECRET=${SESSION_SECRET}
      - ADMIN_USERNAME=${ADMIN_USERNAME}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
      - ADMIN_EMAIL=${ADMIN_EMAIL}
      - GA4_MEASUREMENT_ID=${GA4_MEASUREMENT_ID}
      - META_PIXEL_ID=${META_PIXEL_ID}
      - TURNSTILE_SITE_KEY=${TURNSTILE_SITE_KEY}
      - TURNSTILE_SECRET_KEY=${TURNSTILE_SECRET_KEY}
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    networks:
      - proxy-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.afonso-parquet.rule=Host(`afonsoparquet.ch`)"
      - "traefik.http.routers.afonso-parquet.entrypoints=websecure"
      - "traefik.http.routers.afonso-parquet.tls.certresolver=letsencrypt"
      - "traefik.http.services.afonso-parquet.loadbalancer.server.port=3000"

networks:
  proxy-network:
    external: true
```

### Premier déploiement

1. Configurez les variables d'environnement dans Dockge
2. Démarrez la stack
3. L'admin sera créé automatiquement au premier boot avec `ADMIN_USERNAME` et `ADMIN_PASSWORD`
4. Connectez-vous à `/admin` et changez le mot de passe

## Structure du projet

```
.
├── src/
│   ├── app.js                 # Configuration Express
│   ├── server.js              # Point d'entrée
│   ├── config/
│   │   └── database.js        # Configuration Sequelize
│   ├── models/                # Models Sequelize
│   ├── routes/                # Routes Express
│   ├── controllers/           # Controllers
│   ├── middleware/            # Middleware (auth, locale, upload, etc.)
│   ├── services/              # Services (mailer, etc.)
│   ├── locales/               # Traductions FR/EN
│   ├── views/                 # Templates EJS
│   └── public/                # Assets statiques
├── data/                      # Base SQLite (volume Docker)
├── uploads/                   # Fichiers uploadés (volume Docker)
├── .env                       # Variables d'environnement (ne pas commit)
├── .env.example               # Template de variables
├── Dockerfile                 # Image Docker
├── docker-compose.yml         # Stack Docker pour Dockge
├── .github/workflows/         # GitHub Actions CI/CD
└── package.json
```

## URLs

- **Site public**: `https://afonsoparquet.ch/fr` (FR) ou `/en` (EN)
- **Admin**: `https://afonsoparquet.ch/admin`
- **Sitemap**: `https://afonsoparquet.ch/sitemap.xml`

## Securité

- Argon2id pour hash de mot de passe
- Helmet + CSP
- Rate limiting + CSRF
- Cloudflare Turnstile anti-bot
- Validation robuste de fichiers uploadés (magic bytes)
- Container Docker non-root

## Soutien

Pour des questions ou du support, contactez l'équipe Afonso Parquet.
