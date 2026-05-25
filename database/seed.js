import { DatabaseSync } from 'node:sqlite';
import { randomBytes, pbkdf2 } from 'node:crypto';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(join(__dirname, 'recettes.db'));
db.exec('PRAGMA foreign_keys = ON');
db.exec(readFileSync(join(__dirname, 'schema.sql'), 'utf8'));

/** Hache un mot de passe avec PBKDF2 (même algo que authService) */
function hacherMotDePasse(motDePasse) {
  return new Promise((resolve, reject) => {
    const sel = randomBytes(16).toString('hex');
    pbkdf2(motDePasse, sel, 100_000, 64, 'sha512', (err, key) => {
      if (err) return reject(err);
      resolve(`${sel}:${key.toString('hex')}`);
    });
  });
}

async function seed() {
  const existing = db.prepare('SELECT id FROM utilisateurs WHERE email = ?').get('chef@recettes.eu');
  let userId;
  if (!existing) {
    const hash = await hacherMotDePasse('recettes123');
    const r = db.prepare('INSERT INTO utilisateurs (username, email, mot_de_passe) VALUES (?,?,?)').run('ChefEurope', 'chef@recettes.eu', hash);
    userId = r.lastInsertRowid;
    console.log('Utilisateur seed cree (id=' + userId + ')');
  } else {
    userId = existing.id;
    console.log('Utilisateur seed existant (id=' + userId + ')');
  }

  const recettes = [
    {
      titre: 'Risotto alla Milanese',
      description: "Le risotto au safran emblematique de Milan. Cremeux, dore et parfume, il accompagne traditionnellement l'osso buco.",
      ingredients: "300 g de riz Arborio\n1 litre de bouillon de boeuf chaud\n1 sachet de safran\n1 oignon jaune\n80 g de beurre\n80 g de parmesan rape\n1 verre de vin blanc sec\n2 c. a soupe d'huile d'olive\nSel, poivre",
      etapes: "1. Chauffer le bouillon et y dissoudre le safran.\n2. Faire revenir l'oignon emince dans l'huile et 40 g de beurre 5 min.\n3. Ajouter le riz, le nacrer 2 min en remuant.\n4. Deglacer avec le vin blanc, laisser absorber.\n5. Ajouter le bouillon louche par louche en remuant (18-20 min).\n6. Hors du feu, incorporer le reste du beurre et le parmesan.\n7. Couvrir 2 min, assaisonner et servir immediatement.",
      image_url: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800'
    },
    {
      titre: 'Pasta Carbonara Romaine',
      description: 'La vraie carbonara de Rome : sans creme, juste des oeufs, du guanciale et du pecorino. Simple, riche et inoubliable.',
      ingredients: "400 g de spaghetti\n200 g de guanciale (ou pancetta)\n4 jaunes d'oeufs + 1 oeuf entier\n100 g de pecorino romano rape\n50 g de parmesan rape\nPoivre noir fraichement moulu\nSel (pour l'eau de cuisson)",
      etapes: "1. Cuire les pates al dente dans une grande casserole d'eau salee.\n2. Faire revenir le guanciale en lardons sans matiere grasse jusqu'a croustillant.\n3. Melanger jaunes, oeuf entier, pecorino, parmesan et beaucoup de poivre.\n4. Egoutter les pates en reservant 1 verre d'eau de cuisson.\n5. Hors du feu, melanger pates et guanciale avec sa graisse.\n6. Ajouter le melange oeufs-fromage en remuant, allonger avec l'eau de cuisson.\n7. Servir immediatement avec du poivre supplementaire.",
      image_url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800'
    },
    {
      titre: 'Paella Valenciana',
      description: 'La paella originale de Valence avec poulet, lapin et haricots verts. Cuite pour un fond legerement grille, le socarrat.',
      ingredients: "400 g de riz Bomba\n1 poulet fermier coupe en morceaux\n300 g de lapin en morceaux\n200 g de haricots verts plats\n150 g de haricots blancs cuits\n4 tomates mures rapees\n1 c. a cafe de paprika fume\n1 pincee de safran\n1,2 litre de bouillon de volaille chaud\nHuile d'olive, sel, romarin",
      etapes: "1. Chauffer l'huile dans la paellera, faire dorer poulet et lapin 10 min.\n2. Ajouter les haricots verts, faire revenir 5 min.\n3. Pousser la viande sur les bords, faire revenir la tomate au centre 5 min.\n4. Ajouter le paprika, melanger rapidement.\n5. Verser le bouillon avec le safran, porter a ebullition.\n6. Ajouter le riz en croix, repartir uniformement, ne plus remuer.\n7. Cuire 18-20 min. Les 2 dernieres minutes a feu vif pour le socarrat.\n8. Couvrir d'aluminium, reposer 5 min avant de servir.",
      image_url: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=800'
    },
    {
      titre: 'Gazpacho Andalou',
      description: "Soupe froide de tomates originaire d'Andalousie. Rafraichissante, vitaminees et prete en 10 minutes.",
      ingredients: "1 kg de tomates bien mures\n1 concombre\n1 poivron rouge\n1 gousse d'ail\n1 tranche de pain rassis (sans croute)\n4 c. a soupe d'huile d'olive extra vierge\n2 c. a soupe de vinaigre de Xeres\nSel, eau froide",
      etapes: "1. Tremper le pain dans un peu d'eau froide 5 min.\n2. Eplucher et epepiner le concombre, epepiner le poivron.\n3. Mixer tomates, concombre, poivron, ail et pain essore jusqu'a puree lisse.\n4. Ajouter l'huile d'olive et le vinaigre, mixer encore.\n5. Passer au tamis fin pour une texture soyeuse.\n6. Assaisonner, allonger avec de l'eau froide selon la consistance souhaitee.\n7. Refrigerer au moins 2 heures. Servir tres froid avec des des de legumes.",
      image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800'
    },
    {
      titre: 'Boeuf Bourguignon',
      description: 'Le grand classique bourguignon : boeuf mijote au vin rouge avec lardons, champignons et petits oignons. Un plat qui se bonifie le lendemain.',
      ingredients: "1,5 kg de boeuf a braiser (paleron ou joue)\n75 cl de vin rouge de Bourgogne\n200 g de lardons fumes\n300 g de champignons de Paris\n200 g de petits oignons grelots\n3 carottes\n2 gousses d'ail\n1 bouquet garni (thym, laurier, persil)\n2 c. a soupe de farine\nHuile, beurre, sel, poivre",
      etapes: "1. Couper le boeuf en gros cubes, mariner 12h dans le vin avec carottes, ail et bouquet garni.\n2. Egoutter la viande, reserver la marinade. Secher les morceaux.\n3. Faire dorer la viande en plusieurs fois dans l'huile chaude. Reserver.\n4. Faire revenir les lardons, ajouter les oignons grelots, dorer legerement.\n5. Saupoudrer de farine, melanger, ajouter la marinade filtree.\n6. Remettre la viande, porter a ebullition, couvrir et mijoter 2h30 a feu doux.\n7. Ajouter les champignons 30 min avant la fin.\n8. Rectifier l'assaisonnement, servir avec des pommes de terre vapeur.",
      image_url: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=800'
    },
    {
      titre: "Soupe a l'Oignon Gratinee",
      description: "La soupe a l'oignon parisienne avec ses oignons longuement caramelises, son bouillon de boeuf et sa croute de gruyere fondu.",
      ingredients: "1 kg d'oignons jaunes\n1,5 litre de bouillon de boeuf\n200 ml de vin blanc sec\n50 g de beurre\n1 c. a cafe de sucre\n8 tranches de baguette rassis\n200 g de gruyere rape\nSel, poivre, thym",
      etapes: "1. Emincer finement les oignons.\n2. Faire fondre le beurre avec l'huile, ajouter les oignons et le sucre.\n3. Cuire a feu doux 45 min en remuant jusqu'a caramelisation doree.\n4. Deglacer au vin blanc, laisser reduire 5 min.\n5. Ajouter le bouillon et le thym, mijoter 20 min. Assaisonner.\n6. Faire griller les tranches de baguette au four.\n7. Verser la soupe dans des bols allant au four, poser les croutons, couvrir de gruyere.\n8. Gratiner sous le gril 5 min jusqu'a dorure. Servir immediatement.",
      image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800'
    },
    {
      titre: 'Moussaka Grecque',
      description: "Le plat national grec : couches d'aubergines, de viande hachee a la cannelle et de bechamel doree au four.",
      ingredients: "3 grosses aubergines\n500 g de viande hachee d'agneau\n2 tomates concassees\n1 oignon, 2 gousses d'ail\n1 c. a cafe de cannelle\n1 c. a cafe d'origan\nBechamel : 50 g beurre, 50 g farine, 500 ml lait, 2 jaunes d'oeufs, noix de muscade\nHuile d'olive, sel, poivre",
      etapes: "1. Couper les aubergines en rondelles, saler, degorger 30 min, rincer et secher.\n2. Faire dorer les rondelles d'aubergines a l'huile d'olive. Reserver.\n3. Faire revenir l'oignon et l'ail, ajouter la viande, dorer. Ajouter tomates, cannelle, origan. Mijoter 20 min.\n4. Preparer la bechamel : roux beurre-farine, ajouter le lait chaud progressivement. Hors du feu, incorporer les jaunes et la muscade.\n5. Dans un plat beurre, alterner couches d'aubergines et de viande. Terminer par la bechamel.\n6. Enfourner a 180 degres pendant 45 min jusqu'a dorure.\n7. Laisser reposer 15 min avant de couper et servir.",
      image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800'
    },
    {
      titre: 'Bacalhau a Bras',
      description: "Une des 365 facons portugaises de cuisiner la morue : effilochee avec des pommes de terre paille, des oeufs brouilles et des olives noires.",
      ingredients: "500 g de morue dessalee\n500 g de pommes de terre paille\n6 oeufs\n2 oignons\n3 gousses d'ail\nHuile d'olive\nPersil frais hache\nOlives noires\nSel, poivre",
      etapes: "1. Pocher la morue 10 min dans l'eau fremissante, egoutter, effeuiller en retirant peau et aretes.\n2. Faire revenir les oignons eminces et l'ail dans l'huile d'olive jusqu'a transparence.\n3. Ajouter la morue effilochee, melanger 3 min.\n4. Ajouter les pommes de terre paille, melanger delicatement.\n5. Battre les oeufs, les verser sur la preparation, remuer a feu doux jusqu'a cuisson cremeuse.\n6. Assaisonner, parsemer de persil hache.\n7. Servir garni d'olives noires et d'un filet d'huile d'olive.",
      image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800'
    },
    {
      titre: 'Sauerbraten Rhenan',
      description: "Le roti marine allemand, specialite de Rhenanie. La viande marine plusieurs jours dans le vinaigre pour une tendrete incomparable.",
      ingredients: "1,5 kg de roti de boeuf (gite ou paleron)\nMarinade : 250 ml vinaigre de vin rouge, 250 ml eau, 1 oignon, 2 carottes, 2 feuilles de laurier, 5 clous de girofle, 10 grains de poivre, 1 c. a cafe de sucre\nSauce : 50 g pain d'epices emiettte, 50 g raisins secs, 2 c. a soupe de creme fraiche",
      etapes: "1. Porter la marinade a ebullition, laisser refroidir. Immerger la viande 3 a 5 jours au refrigerateur.\n2. Sortir la viande, secher. Filtrer et reserver la marinade.\n3. Faire dorer le roti sur toutes les faces dans une cocotte.\n4. Ajouter les legumes de la marinade, verser la marinade filtree.\n5. Couvrir et mijoter 2h30 a feu doux en retournant a mi-cuisson.\n6. Retirer la viande, filtrer le jus. Ajouter pain d'epices et raisins secs, epaissir 10 min.\n7. Incorporer la creme, rectifier l'assaisonnement.\n8. Trancher le roti, napper de sauce. Servir avec des Spatzle.",
      image_url: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800'
    },
    {
      titre: 'Bigos Polonais',
      description: "Le plat national polonais, le chasseur's stew. Un ragout de choucroute et chou frais avec plusieurs viandes fumees.",
      ingredients: "500 g de choucroute\n300 g de chou blanc frais\n200 g de poitrine fumee\n200 g de saucisse kielbasa\n150 g de viande de porc cuite\n30 g de champignons seches\n1 oignon\n200 ml de vin rouge\n2 feuilles de laurier, 5 grains de poivre de la Jamaique\nSel, poivre, marjolaine",
      etapes: "1. Rehydrater les champignons seches 30 min dans l'eau tiede. Reserver l'eau de trempage.\n2. Rincer la choucroute, la couper grossierement. Emincer le chou frais.\n3. Faire revenir l'oignon et la poitrine fumee en des.\n4. Ajouter les deux choux, les champignons egouttes, les epices.\n5. Verser le vin rouge et l'eau des champignons filtree.\n6. Ajouter les viandes coupees en morceaux, melanger.\n7. Mijoter a couvert 1h30 a feu doux en remuant de temps en temps.\n8. Meilleur rechauffe le lendemain. Servir avec du pain de seigle.",
      image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800'
    },
    {
      titre: 'Goulash Hongrois',
      description: "Le gulyas authentique de Hongrie : un bouillon epais de boeuf et de paprika, bien different du ragout epaissit qu'on connait en Europe de l'Ouest.",
      ingredients: "800 g de boeuf a braiser (epaule)\n3 oignons\n3 c. a soupe de paprika doux hongrois\n1 c. a cafe de paprika fort\n3 pommes de terre\n2 tomates\n2 poivrons verts\n1 c. a cafe de carvi\n1,5 litre de bouillon de boeuf\nSaindoux ou huile, sel",
      etapes: "1. Faire fondre le saindoux, faire revenir les oignons eminces jusqu'a dorure.\n2. Retirer du feu, ajouter le paprika hors du feu, melanger.\n3. Remettre sur le feu, ajouter le boeuf en cubes de 3 cm, faire revenir 5 min.\n4. Ajouter le carvi, les tomates concassees, couvrir d'eau. Mijoter 1h.\n5. Ajouter les pommes de terre en cubes et les poivrons, cuire encore 30 min.\n6. Le goulash doit etre un bouillon epais. Ajuster la consistance.\n7. Servir dans des bols profonds avec du pain blanc.",
      image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800'
    },
  ];

  const insert = db.prepare(
    'INSERT OR IGNORE INTO recettes (titre, description, ingredients, etapes, image_url, utilisateur_id) VALUES (?,?,?,?,?,?)'
  );

  let count = 0;
  for (const r of recettes) {
    const result = insert.run(r.titre, r.description, r.ingredients, r.etapes, r.image_url, userId);
    if (result.changes > 0) count++;
  }

  console.log(count + ' recette(s) inseree(s) sur ' + recettes.length + '.');
  db.close();
}

seed().catch(err => { console.error(err); process.exit(1); });
