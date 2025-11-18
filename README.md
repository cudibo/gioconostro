# 🎮 Gioco del Codice - Evita il Mostro

Un gioco educativo tipo "Ora del Codice" dove devi trascinare blocchi di codice visuale (come Scratch) per far muovere l'eroe e raggiungere l'obiettivo senza incontrare il mostro!

## 🎯 Come Giocare

1. **Trascina i blocchi** dalla sezione "Blocchi Disponibili" alla sezione "Il Tuo Programma"
2. **Crea il tuo programma** combinando blocchi di movimento (Su, Giù, Sinistra, Destra) e ripetizioni
3. **Clicca "Esegui"** per vedere l'eroe muoversi seguendo il tuo programma
4. **Raggiungi l'obiettivo** (bandierina verde) senza essere catturato dal mostro!

## 🚀 Pubblicazione su GitHub Pages

### Prerequisiti
- Un account GitHub
- Git installato sul tuo computer

### Passi per pubblicare:

1. **Crea un nuovo repository su GitHub**
   - Vai su GitHub e crea un nuovo repository
   - Non inizializzarlo con README, .gitignore o licenza (se hai già i file localmente)

2. **Inizializza Git nel progetto** (se non l'hai già fatto)
   ```bash
   git init
   ```

3. **Aggiungi tutti i file**
   ```bash
   git add .
   git commit -m "Initial commit: Gioco del Codice"
   ```

4. **Collega il repository locale a GitHub**
   ```bash
   git remote add origin https://github.com/TUO-USERNAME/NOME-REPOSITORY.git
   git branch -M main
   git push -u origin main
   ```

5. **Attiva GitHub Pages**
   - Vai nelle impostazioni del repository su GitHub
   - Scorri fino a "Pages" nella sidebar
   - Sotto "Source", seleziona "Deploy from a branch"
   - Scegli il branch `main` e la cartella `/ (root)`
   - Clicca "Save"

6. **Il tuo gioco sarà disponibile a:**
   ```
   https://TUO-USERNAME.github.io/NOME-REPOSITORY/
   ```

## 📁 Struttura del Progetto

```
gioconostro/
├── index.html          # Pagina principale
├── style.css           # Stili CSS
├── game.js             # Logica del gioco
├── assets/             # Immagini del gioco
│   ├── eroe-colors-ai.png
│   ├── mostro-colors.png
│   └── mappa.jpeg
└── README.md           # Questo file
```

## ⚙️ Configurazione

Puoi personalizzare le immagini del gioco modificando il file `game.js`:

```javascript
const gameConfig = {
    images: {
        hero: 'assets/eroe-colors-ai.png',
        monster: 'assets/mostro-colors.png',
        map: 'assets/mappa.jpeg'
    }
};
```

## 🛠️ Tecnologie Utilizzate

- HTML5
- CSS3
- JavaScript (Vanilla)
- HTML5 Canvas API

## 📝 Licenza

Questo progetto è open source e disponibile per uso educativo.

