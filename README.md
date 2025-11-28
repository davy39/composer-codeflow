# Bac à sable pour composer (PHP)

---

## 🐘 Tester

[![Open in Codeflow](https://developer.stackblitz.com/img/open_in_codeflow.svg)](https://pr.new/davy39/composer-codeflow?file=README.md)

_Si vous rencontrez des problèmes, esayez avec google chrome._

---

Ce projet expérimental est une configuration avancée pour utiliser le **Composer** de **PHP** avec le Codeflow de Stackblitz.

Il utilise est constitué d'une extension pour permettre à composer d'utiliser un proxy CORS et différents scripts pour permettre à php-wasm, et composer de s'installer et de fonctionner dans votre navigateur.

## Utilisation

Après l'initialisation de l'environnement, lancer la commande suivante :

```bash
setup.sh
```

A la fin de l'installation, les commandes `php` et `composer` seront utilisables.

## Exemple d'utilisation

```bash
# Installation du site de démo de laravel dans le dossier mon_site
composer create-project laravel/laravel mon_site

# Configuration du projet
composer -d mon_site run setup

#
composer -d mon_site run dev
```

Cliquez à gauche sur le port `8000` pour accéder au site.
