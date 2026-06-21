# 🚀 Guia de Deploy - Afonso Parquet

## Pré-requisitos no Servidor

- Docker instalado
- Dockge (ou Docker Compose)
- Reverse proxy configurado (Traefik ou Nginx Proxy Manager)
- Domínio apontando para o servidor (afonsoparquet.ch)
- SSL configurado (Let's Encrypt)

---

## 📦 Opção 1: Deploy com Dockge (Recomendado)

### Passo 1: Acesse o Dockge
Acesse sua interface Dockge (geralmente em `https://seu-servidor:5001`)

### Passo 2: Criar Nova Stack
1. Clique em "**+ Compose**"
2. Nome da stack: `afonso-parquet`

### Passo 3: Cole o docker-compose.yml
Cole o conteúdo do arquivo `docker-compose.yml` deste repositório.

### Passo 4: Configure Variáveis de Ambiente

No Dockge, clique em "**Environment**" e adicione:

```env
# Obrigatórias
SESSION_SECRET=gere-uma-chave-aleatoria-forte-aqui-123456789
ADMIN_PASSWORD=sua-senha-forte-aqui
ADMIN_EMAIL=seu-email@example.com

# SMTP (Opcionais - mas recomendadas)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
SMTP_FROM_EMAIL=contact@afonsoparquet.ch
ADMIN_EMAIL=admin@afonsoparquet.ch

# Analytics (Opcionais)
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
META_PIXEL_ID=123456789

# Turnstile (Opcional - anti-spam)
TURNSTILE_SITE_KEY=0x4AAAAAAA...
TURNSTILE_SECRET_KEY=0x4AAAAAAA...

# Company
COMPANY_PHONE=+41123456789

# Social
INSTAGRAM_URL=https://instagram.com/afonsoparquet
FACEBOOK_URL=https://facebook.com/afonsoparquet
```

### Passo 5: Ajustar Labels Traefik

Se usar **Nginx Proxy Manager** em vez de Traefik, **remova** as labels do Traefik e configure manualmente no NPM:
- Host: `afonsoparquet.ch`
- Forward to: `afonso-parquet:3000`
- SSL: Let's Encrypt

Se usar **Traefik**, as labels já estão configuradas. Apenas ajuste:
- Network: certifique-se que a network `proxy` existe
- Certresolver: ajuste para o nome do seu resolver (padrão: `letsencrypt`)

### Passo 6: Iniciar Stack
1. Clique em "**Start**"
2. Aguarde o download da imagem (~100MB)
3. Verifique os logs para confirmar que iniciou:
```
✓ Database connected successfully.
✓ SQLite configured with WAL mode and busy timeout
✓ Database models synchronized.
Server running on http://0.0.0.0:3000
Environment: production
```

---

## 📦 Opção 2: Deploy Manual com Docker Compose

```bash
# 1. Criar diretório
mkdir -p ~/apps/afonso-parquet
cd ~/apps/afonso-parquet

# 2. Baixar docker-compose.yml
wget https://raw.githubusercontent.com/juniorafonso/AfonsoParquet/main/docker-compose.yml

# 3. Criar arquivo .env
nano .env
# (cole as variáveis do Passo 4 acima)

# 4. Iniciar
docker-compose up -d

# 5. Ver logs
docker-compose logs -f
```

---

## 🔐 Primeiro Acesso Admin

Após deploy, acesse:
```
https://afonsoparquet.ch/admin/login
```

**Credenciais iniciais:**
- Username: `admin` (ou o que configurou em `ADMIN_USERNAME`)
- Password: o que configurou em `ADMIN_PASSWORD`

⚠️ **IMPORTANTE:** Mude a senha imediatamente em "Change Password"!

---

## 🔄 Atualizações Automáticas

O sistema está configurado com **CI/CD via GitHub Actions**:

1. ✅ Você faz push para `main`
2. ✅ GitHub Actions builda a imagem Docker automaticamente
3. ✅ Publica em `ghcr.io/juniorafonso/afonsoparquet:latest`
4. 🔄 No servidor, rode para atualizar:

```bash
# Via Dockge: apenas clique em "Pull & Restart"

# Via Docker Compose:
cd ~/apps/afonso-parquet
docker-compose pull
docker-compose up -d
```

---

## 📊 Verificar Status

```bash
# Status dos containers
docker ps | grep afonso-parquet

# Logs em tempo real
docker logs -f afonso-parquet

# Health check
curl http://localhost:3000/
```

---

## 🗂️ Backup

**Dados importantes estão nos volumes:**

```bash
# Backup do banco de dados
tar -czf backup-$(date +%Y%m%d).tar.gz ./data ./uploads

# Restaurar
tar -xzf backup-20260621.tar.gz
```

**Automatizar backup diário:**
```bash
# Adicionar ao crontab
0 2 * * * cd ~/apps/afonso-parquet && tar -czf ~/backups/afonso-parquet-$(date +\%Y\%m\%d).tar.gz ./data ./uploads
```

---

## 🛠️ Troubleshooting

### Container não inicia
```bash
docker logs afonso-parquet
```

### Porta 3000 já em uso
Ajuste no `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # muda para 3001 externamente
```

### Sessão perdida após restart
Verifique se o volume `./data` está corretamente montado (SQLite + sessions lá)

### Emails não enviam
- Verifique variáveis SMTP no `.env`
- Logs mostrarão: `⚠️ SMTP not configured` se faltarem vars
- Teste SMTP: https://www.smtper.net/

### SSL/HTTPS não funciona
- Certifique-se que DNS está apontando para o servidor
- Verifique Traefik/NPM logs
- Teste: `curl -I https://afonsoparquet.ch`

---

## 📞 Suporte

- **Logs:** Sempre verifique primeiro `docker logs afonso-parquet`
- **Health:** `http://localhost:3000/` deve retornar 200 OK
- **Admin:** Se esquecer senha, use `scripts/resetAdminPassword.js`

---

## ✅ Checklist Pós-Deploy

- [ ] Site acessível via HTTPS
- [ ] Login admin funciona
- [ ] Formulário devis funciona
- [ ] Upload de fotos funciona
- [ ] Emails sendo enviados (se SMTP configurado)
- [ ] GA4 tracking ativo (se configurado)
- [ ] Backup automático configurado
- [ ] SSL válido (Let's Encrypt)

🎉 **Deploy completo! Site no ar!**
