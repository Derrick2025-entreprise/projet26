# Monitoring - Recettes de France

Ce dossier contient la configuration pour le monitoring et l'observabilité de l'application.

## 📊 Stack de Monitoring

- **Prometheus** : Collecte et stockage des métriques
- **Grafana** : Visualisation et dashboards
- **Node Exporter** : Métriques système

## 🚀 Démarrage

### Avec Docker Compose

```bash
# Démarrer tous les services de monitoring
docker-compose up -d

# Vérifier les logs
docker-compose logs -f prometheus
docker-compose logs -f grafana
```

### Accès aux interfaces

- **Application** : http://localhost:3000
- **Prometheus** : http://localhost:9090
- **Grafana** : http://localhost:3001
  - Username: `admin`
  - Password: `admin` (à changer en production)
- **Node Exporter** : http://localhost:9100

## 📈 Métriques Collectées

### Métriques de l'application

- Nombre de requêtes HTTP
- Temps de réponse
- Taux d'erreur
- Nombre d'utilisateurs actifs
- Opérations sur la base de données

### Métriques système

- Utilisation CPU
- Utilisation mémoire
- Utilisation disque
- Trafic réseau

## 📊 Dashboards Grafana

### Dashboard Principal

Le dashboard principal affiche :

1. **Vue d'ensemble**
   - Nombre total de requêtes
   - Taux d'erreur
   - Temps de réponse moyen
   - Utilisateurs actifs

2. **Performance**
   - Graphique des temps de réponse
   - Distribution des codes HTTP
   - Requêtes par endpoint

3. **Ressources système**
   - Utilisation CPU
   - Utilisation mémoire
   - Espace disque

### Importer un dashboard

1. Ouvrir Grafana (http://localhost:3001)
2. Aller dans **Dashboards** → **Import**
3. Charger le fichier JSON depuis `monitoring/grafana/dashboards/`

## 🔔 Alertes

### Configuration des alertes

Les alertes sont configurées dans `prometheus.yml` et peuvent être personnalisées selon vos besoins.

### Exemples d'alertes

- Application down
- Taux d'erreur élevé (> 5%)
- Temps de réponse lent (> 2s)
- Utilisation mémoire élevée (> 80%)
- Utilisation CPU élevée (> 80%)

## 🛠️ Configuration

### Prometheus

Fichier : `monitoring/prometheus.yml`

```yaml
scrape_configs:
  - job_name: 'recettes-france-app'
    static_configs:
      - targets: ['app:3000']
```

### Grafana

Datasources et dashboards sont provisionnés automatiquement via :
- `monitoring/grafana/datasources/`
- `monitoring/grafana/dashboards/`

## 📝 Ajouter des métriques personnalisées

### Dans votre code Node.js

```javascript
const prometheus = require('prom-client');

// Créer un compteur
const httpRequestCounter = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total des requêtes HTTP',
  labelNames: ['method', 'route', 'status']
});

// Incrémenter le compteur
httpRequestCounter.inc({ method: 'GET', route: '/api/recettes', status: 200 });
```

## 🔍 Requêtes Prometheus Utiles

### Taux de requêtes par seconde
```promql
rate(http_requests_total[5m])
```

### Temps de réponse moyen
```promql
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])
```

### Taux d'erreur
```promql
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])
```

## 🐛 Dépannage

### Prometheus ne collecte pas les métriques

1. Vérifier que l'application expose `/metrics`
2. Vérifier la configuration dans `prometheus.yml`
3. Consulter les logs : `docker-compose logs prometheus`

### Grafana ne se connecte pas à Prometheus

1. Vérifier que Prometheus est accessible
2. Vérifier la configuration du datasource
3. Tester la connexion dans Grafana UI

### Dashboards vides

1. Vérifier que les métriques sont collectées dans Prometheus
2. Vérifier les requêtes PromQL dans les panels
3. Ajuster la période de temps affichée

## 📚 Ressources

- [Documentation Prometheus](https://prometheus.io/docs/)
- [Documentation Grafana](https://grafana.com/docs/)
- [Node Exporter](https://github.com/prometheus/node_exporter)
- [Prom-client (Node.js)](https://github.com/siimon/prom-client)

## 🔒 Sécurité en Production

⚠️ **Important** : En production, pensez à :

1. Changer les mots de passe par défaut
2. Activer l'authentification sur Prometheus
3. Utiliser HTTPS
4. Restreindre l'accès réseau
5. Configurer des alertes appropriées

## 📞 Support

Pour toute question sur le monitoring, consultez la documentation ou ouvrez une issue sur GitHub.
