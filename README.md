# Vintage Marketplace Project - Vinted 2.0

O platformă web modernă de tip marketplace dedicată revânzării hainelor vintage, similară platformei Vinted, dar îmbogățită cu funcționalități inteligente bazate pe Inteligență Artificială.

## 🌟 Descriere Generală
Aplicația propusă facilitează comerțul sustenabil între utilizatori, oferind un mediu securizat și inteligent pentru vânzarea și cumpărarea de articole vestimentare. Accentul este pus pe calitatea produselor și experiența utilizatorului prin automatizarea proceselor de descriere și filtrare.

## 🚀 Funcționalități Core
- **User Management**: Creare cont, autentificare și gestionare profil personal.
- **Marketplace**: Listare produse, căutare avansată, filtrare și sortare dinamică.
- **Interacțiune**: Sistem de mesagerie între utilizatori pentru negociere și plasarea ofertelor.
- **Tranzacții & Favorite**: Adăugare produse în wishlist și flux de plasare comenzi.
- **Sistem de Feedback**: Review-uri detaliate pentru vânzători bazate pe comunicare, viteză de shipping și timp de răspuns.
- **Smart Badges**: Insigne pentru "Trusted Seller", "Materiale Naturale" sau "Sustenabilitate".

## 🧠 Module AI Inteligente

### 1. Agent AI pentru Descrieri
Ajută vânzătorii să creeze descrieri atractive pornind de la câteva cuvinte cheie.
- Generare text bazată pe cuvinte cheie de căutare.
- Sugerarea celor mai relevante hashtag-uri pentru vizibilitate maximă.

### 2. Agent AI Anti-Resell (Anti-Scam)
Protejează comunitatea împotriva produselor de tip fast-fashion (Shein, Temu) vândute la suprapreț.
- **Analiză Imagine**: Identifică vizual produsele de calitate inferioară.
- **Trust Score**: Marchează produsele suspecte și oferă un scor de încredere cumpărătorului.

### 3. Căutare și Recomandări Smart
- **Detecție Automată**: Recunoașterea categoriei (ex: "rochie vară") și a brandului din textul căutat.
- **Algoritm Recomandare**: Sugestii pe pagina produsului bazate pe:
  - Produse de la același vânzător.
  - Articole cu hashtag-uri similare.
  - Produse din același brand sau stil/categorie.

## 🛠️ Tehnologii Utilizate

### Backend
- **Limbaj**: Python
- **Framework**: Django (REST API)

### Frontend
- **Framework**: Vite-powered React (JavaScript)
- **Styling**: Tailwind CSS / Bootstrap / HTML & CSS

### AI / Machine Learning
- **NLP**: API-uri externe sau modele open-source pentru procesarea textului.
- **Computer Vision**: Modele de procesare a imaginilor pentru detectarea tentativelor de scam.

