CREATE TABLE IF NOT EXISTS utilisateurs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    mot_de_passe TEXT NOT NULL,
    cree_le DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recettes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titre TEXT NOT NULL,
    description TEXT,
    ingredients TEXT NOT NULL,
    etapes TEXT NOT NULL,
    image_url TEXT,
    utilisateur_id INTEGER NOT NULL,
    cree_le DATETIME DEFAULT CURRENT_TIMESTAMP,
    modifie_le DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
);

CREATE TABLE IF NOT EXISTS favoris (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utilisateur_id INTEGER NOT NULL,
    recette_id INTEGER NOT NULL,
    cree_le DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(utilisateur_id, recette_id),
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (recette_id) REFERENCES recettes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utilisateur_id INTEGER NOT NULL,
    recette_id INTEGER NOT NULL,
    etoiles INTEGER NOT NULL CHECK (etoiles >= 1 AND etoiles <= 5),
    suggestion TEXT,
    cree_le DATETIME DEFAULT CURRENT_TIMESTAMP,
    modifie_le DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(utilisateur_id, recette_id),
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (recette_id) REFERENCES recettes(id) ON DELETE CASCADE
);
