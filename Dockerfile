# Utiliser une image Node.js officielle
FROM node:22-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier uniquement les fichiers nécessaires (évite de copier .env, .git, etc.)
COPY controllers ./controllers
COPY database ./database
COPY middleware ./middleware
COPY public ./public
COPY routes ./routes
COPY services ./services
COPY views ./views
COPY app.js ./

# Exposer le port de l'application
EXPOSE 3000

# Définir les variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3000

# Créer un utilisateur non-root pour exécuter l'application
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Changer vers l'utilisateur non-root
USER nodejs

# Commande pour démarrer l'application
CMD ["node", "--experimental-sqlite", "app.js"]
