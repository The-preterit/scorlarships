# Hello World PWA

Une Progressive Web App de démonstration qui affiche "Hello World", optimisée pour iOS.

## Structure du projet

```
/home/sylvain/Documents/works/scorlarships/
├── index.html              # Page principale de la PWA
├── manifest.json           # Manifeste PWA pour l'installation
├── sw.js                   # Service Worker pour le fonctionnement hors ligne
├── icons/                  # Dossier contenant les icônes
│   ├── icon-72.png
│   ├── icon-96.png
│   ├── icon-128.png
│   ├── icon-144.png
│   ├── icon-152.png
│   ├── icon-192.png
│   ├── icon-384.png
│   └── icon-512.png
└── generate-icons.html     # Outil pour générer les icônes PNG
```

## Génération des icônes PNG

Les icônes SVG sont fournies, mais iOS nécessite des icônes PNG. Pour les générer :

1. Ouvrez le fichier `generate-icons.html` dans votre navigateur
2. Cliquez sur "Télécharger" pour chaque taille d'icône
3. Placez tous les fichiers PNG téléchargés dans le dossier `icons/`

## Test de la PWA

### Sur un serveur local

Pour tester la PWA, vous avez besoin d'un serveur HTTPS (obligatoire pour les Service Workers).

#### Option 1: Utiliser Python (recommandé)

```bash
cd /home/sylvain/Documents/works/scorlarships
python3 -m http.server 8000
```

Puis accédez à: http://localhost:8000

#### Option 2: Utiliser Node.js

```bash
npx serve .
```

### Pour un test sur iOS

Les Service Workers nécessitent HTTPS, sauf sur localhost.

#### Option 1: Utiliser ngrok (tunnel HTTPS)

```bash
npx http-server -p 8000
npx ngrok http 8000
```

Utilisez l'URL HTTPS fournie par ngrok sur votre iPhone.

#### Option 2: Déployer sur un hébergeur

- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting

## Installation sur iOS

1. Ouvrez Safari sur votre iPhone
2. Accédez à l'URL de votre PWA (HTTPS)
3. Appuyez sur le bouton Partager (icône de flèche vers le haut)
4. Sélectionnez "Sur l'écran d'accueil"
5. Appuyez sur "Ajouter" en haut à droite

La PWA sera installée comme une application native sur votre écran d'accueil.

## Fonctionnalités

- ✅ Affichage "Hello World" avec design moderne
- ✅ Fonctionne hors ligne (Service Worker)
- ✅ Installable sur iOS et Android
- ✅ Icônes adaptatives pour tous les appareils
- ✅ Safe Area support pour les iPhone avec encoche
- ✅ Animations fluides
- ✅ Thème couleur cohérent

## Personnalisation

### Changer les couleurs

Dans `index.html`, modifiez le gradient CSS :
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

Dans `manifest.json`, modifiez :
```json
"background_color": "#667eea",
"theme_color": "#4a90d9"
```

### Changer le titre

Modifiez dans `manifest.json` :
```json
"name": "Votre Titre",
"short_name": "Titre"
```

Et dans `index.html` :
```html
<title>Votre Titre</title>
```

## Support navigateur

- ✅ Safari iOS 11.3+
- ✅ Chrome Android
- ✅ Firefox
- ✅ Edge
