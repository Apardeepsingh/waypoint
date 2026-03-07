import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock, Star, Leaf, ArrowRight, Plus, CheckCircle2,
  MapPin, Camera, TreePine, Building2, Utensils, Bike, Heart,
  Loader2, Sparkles, AlertCircle, RefreshCw, Mountain, Waves,
} from "lucide-react";
import { useTrip } from "../context/TripContext";
import { searchActivitiesNear } from "../services/placesSearch";
import { getEcoActivities } from "../services/openRouter";

/* Category → icon map (for AI-generated activities) */
const CAT_ICONS = {
  nature:      TreePine,
  culture:     Camera,
  sightseeing: Building2,
  food:        Utensils,
  adventure:   Mountain,
  beach:       Waves,
  cycling:     Bike,
  default:     MapPin,
};

/* Destination-agnostic stock photo bank by category */
const STOCK_PHOTOS = {
  nature:      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
  culture:     "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800&q=80",
  sightseeing: "https://images.unsplash.com/photo-1473951574080-01fe45ec8643?w=800&q=80",
  food:        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
  adventure:   "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80",
  default:     "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80",
};

/* ─────────────────────────────────────────
   IMAGES (from Figma source)
───────────────────────────────────────── */
const IMGS = {
  sightseeing: "https://images.unsplash.com/photo-1759782177643-9512c9497f95?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=800",
  hiking:      "https://images.unsplash.com/photo-1631544188176-03077df0c9e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=800",
  museum:      "https://images.unsplash.com/photo-1651787646556-3c1196621b1a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=800",
  market:      "https://images.unsplash.com/photo-1772588181186-b4476f380ea3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=800",
  kayak:       "https://images.unsplash.com/photo-1759496959924-b2d79dcdda18?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=800",
  cycling:     "https://images.unsplash.com/photo-1764060826589-f89fac7acc81?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=800",
};

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
/* ─────────────────────────────────────────
   CITY-SPECIFIC ACTIVITY BANKS
   Keyed by lowercase city name. Used as a rich
   static fallback when APIs are unavailable.
───────────────────────────────────────── */
const CITY_ACTIVITIES = {
  paris: [
    { id:"p1", title:"Versailles Palace & Gardens",    category:"sightseeing", image:IMGS.sightseeing, description:"Explore the magnificent Palace of Versailles and its stunning gardens, a UNESCO World Heritage site just outside Paris.", price:22, duration:"Full Day",   emissions:0.8,  rating:4.9, reviews:18420, tags:["UNESCO","Historic","Gardens"],          Icon:Building2, featured:false },
    { id:"p2", title:"Forest Hiking in Fontainebleau", category:"nature",      image:IMGS.hiking,      description:"Trek through the ancient Fontainebleau forest, home to diverse wildlife and stunning sandstone formations.",          price:0,  duration:"4–6 hours", emissions:0.1,  rating:4.8, reviews:3210,  tags:["Free Entry","Wildlife","Eco-Certified"],    Icon:TreePine,  featured:true  },
    { id:"p3", title:"Louvre Museum Tour",              category:"culture",     image:IMGS.museum,      description:"Discover world-class art spanning thousands of years at the world's largest art museum in the heart of Paris.",        price:17, duration:"3–4 hours", emissions:0.3,  rating:4.7, reviews:42100, tags:["Skip-the-Line","Cultural","Indoor"],        Icon:Camera,    featured:false },
    { id:"p4", title:"Parisian Farmers' Market Tour",   category:"food",        image:IMGS.market,      description:"Explore authentic Parisian food markets, taste local produce and learn about sustainable French gastronomy.",          price:12, duration:"2 hours",   emissions:0.05, rating:4.9, reviews:1870,  tags:["Local Food","Sustainable","Guided"],        Icon:Utensils,  featured:false },
    { id:"p5", title:"Seine River Kayak Adventure",     category:"adventure",   image:IMGS.kayak,       description:"Paddle along the Seine and take in iconic Parisian landmarks from a unique water-level perspective.",               price:45, duration:"3 hours",   emissions:0.2,  rating:4.6, reviews:940,   tags:["Outdoor","Active","River View"],            Icon:Heart,     featured:false },
    { id:"p6", title:"Paris City Cycling Tour",         category:"adventure",   image:IMGS.cycling,     description:"Explore Paris on two wheels with an expert guide, covering hidden gems and iconic neighbourhoods.",                  price:28, duration:"3 hours",   emissions:0,    rating:4.8, reviews:5430,  tags:["Zero Emission","Active","Guided"],          Icon:Bike,      featured:false },
  ],
  london: [
    { id:"l1", title:"Tower of London & Crown Jewels",  category:"sightseeing", image:IMGS.sightseeing, description:"Explore the 1,000-year-old Tower of London, home to the dazzling Crown Jewels and centuries of royal history.", price:30, duration:"3 hours",   emissions:0.4,  rating:4.8, reviews:21000, tags:["UNESCO","Historic","Iconic"],              Icon:Building2, featured:true  },
    { id:"l2", title:"Hyde Park & Regent's Canal Cycle",category:"adventure",   image:IMGS.cycling,     description:"Cycle through Hyde Park and along Regent's Canal towpath — a green urban escape through London's prettiest parks.", price:18, duration:"2.5 hours",emissions:0,    rating:4.7, reviews:3200,  tags:["Zero Emission","Active","Parks"],           Icon:Bike,      featured:false },
    { id:"l3", title:"British Museum",                  category:"culture",     image:IMGS.museum,      description:"Explore 8 million objects from world civilisations across 3,000 years of human history — completely free entry.",   price:0,  duration:"3–4 hours", emissions:0.2,  rating:4.8, reviews:38500, tags:["Free Entry","Cultural","Indoor"],           Icon:Camera,    featured:false },
    { id:"l4", title:"Borough Market Food Tour",        category:"food",        image:IMGS.market,      description:"Taste your way through London's oldest food market with a local guide — artisan produce and sustainable vendors.",   price:25, duration:"2 hours",   emissions:0.05, rating:4.9, reviews:2100,  tags:["Local Food","Sustainable","Guided"],        Icon:Utensils,  featured:false },
    { id:"l5", title:"Thames Path River Walk",          category:"nature",      image:IMGS.hiking,      description:"Walk the Thames Path from Tower Bridge to Greenwich — 11 km of riverside greenery with stunning city views.",       price:0,  duration:"3–4 hours", emissions:0.05, rating:4.7, reviews:5600,  tags:["Free","Scenic","Eco-Friendly"],             Icon:TreePine,  featured:false },
    { id:"l6", title:"East End Street Art Walking Tour",category:"culture",     image:IMGS.market,      description:"Discover world-famous Banksy murals and vibrant street art in Shoreditch and Brick Lane with an expert guide.",      price:20, duration:"2 hours",   emissions:0.1,  rating:4.6, reviews:1450,  tags:["Urban Art","Guided","Cultural"],            Icon:Camera,    featured:false },
  ],
  amsterdam: [
    { id:"a1", title:"Van Gogh Museum",                 category:"culture",     image:IMGS.museum,      description:"Home to the world's largest collection of Van Gogh artworks — an unmissable cultural experience in Amsterdam.",       price:22, duration:"2–3 hours", emissions:0.3,  rating:4.8, reviews:19200, tags:["Art","Cultural","Indoor"],                  Icon:Camera,    featured:true  },
    { id:"a2", title:"Canal Boat & Cycling Day",        category:"adventure",   image:IMGS.cycling,     description:"Explore Amsterdam's iconic canals by electric boat, then cycle through the historic Jordaan neighbourhood.",          price:35, duration:"4 hours",   emissions:0.1,  rating:4.7, reviews:4300,  tags:["Zero Emission","Active","Canals"],          Icon:Bike,      featured:false },
    { id:"a3", title:"Rijksmuseum",                     category:"culture",     image:IMGS.museum,      description:"Discover 800 years of Dutch art and history, including Rembrandt and Vermeer masterpieces.",                         price:22, duration:"3 hours",   emissions:0.3,  rating:4.8, reviews:25000, tags:["Art","Historic","UNESCO"],                  Icon:Camera,    featured:false },
    { id:"a4", title:"Anne Frank House",                category:"sightseeing", image:IMGS.sightseeing, description:"Visit the historic hiding place of Anne Frank and learn about one of history's most powerful stories of resilience.", price:16, duration:"2 hours",   emissions:0.2,  rating:4.9, reviews:32000, tags:["Historic","Cultural","Essential"],          Icon:Building2, featured:false },
    { id:"a5", title:"Hortus Botanicus Garden",         category:"nature",      image:IMGS.hiking,      description:"Wander through one of the world's oldest botanical gardens, home to 6,000 plant species in beautiful Amsterdam.",    price:11, duration:"2 hours",   emissions:0.05, rating:4.7, reviews:2800,  tags:["Nature","Gardens","Eco-Certified"],         Icon:TreePine,  featured:false },
    { id:"a6", title:"Dutch Street Food Market Tour",   category:"food",        image:IMGS.market,      description:"Taste traditional Dutch cheeses, fresh herring and local delicacies on a guided walking food tour.",                 price:28, duration:"2.5 hours",emissions:0.05, rating:4.8, reviews:1900,  tags:["Local Food","Guided","Sustainable"],        Icon:Utensils,  featured:false },
  ],
  berlin: [
    { id:"b1", title:"East Side Gallery & Wall Trail",  category:"culture",     image:IMGS.museum,      description:"Walk 1.3 km of the Berlin Wall turned open-air gallery — the world's largest permanent outdoor art installation.",    price:0,  duration:"2 hours",   emissions:0.05, rating:4.8, reviews:29000, tags:["Free","Historic","Street Art"],             Icon:Camera,    featured:true  },
    { id:"b2", title:"Tiergarten Forest Cycling",       category:"adventure",   image:IMGS.cycling,     description:"Cycle through Berlin's vast Tiergarten — 210 hectares of parkland in the heart of the city.",                        price:12, duration:"2–3 hours", emissions:0,    rating:4.7, reviews:3100,  tags:["Zero Emission","Parks","Active"],           Icon:Bike,      featured:false },
    { id:"b3", title:"Museum Island Tour",              category:"culture",     image:IMGS.museum,      description:"Explore 5 world-class museums on a UNESCO island — home to the Pergamon Altar and the Bust of Nefertiti.",           price:22, duration:"3–4 hours", emissions:0.3,  rating:4.8, reviews:15600, tags:["UNESCO","Art","Historic"],                  Icon:Camera,    featured:false },
    { id:"b4", title:"Berlin Street Food Market",       category:"food",        image:IMGS.market,      description:"Explore Markthalle Neun and Mauerpark market — street food from 40 countries and Berlin's thriving food scene.",    price:15, duration:"2 hours",   emissions:0.05, rating:4.8, reviews:5200,  tags:["Local Food","Sustainable","Weekend"],       Icon:Utensils,  featured:false },
    { id:"b5", title:"Tempelhofer Field Walk & Picnic", category:"nature",      image:IMGS.hiking,      description:"Stroll or cycle across the former Tempelhof Airport — now a vast green urban park beloved by Berliners.",            price:0,  duration:"2–3 hours", emissions:0.05, rating:4.7, reviews:8900,  tags:["Free","Urban Green","Eco-Certified"],       Icon:TreePine,  featured:false },
    { id:"b6", title:"Brandenburg Gate & Reichstag",    category:"sightseeing", image:IMGS.sightseeing, description:"Visit Berlin's most iconic landmark then tour the glass-domed Reichstag for panoramic city views — free entry.",    price:0,  duration:"3 hours",   emissions:0.1,  rating:4.9, reviews:41000, tags:["Free","Iconic","Historic"],                 Icon:Building2, featured:false },
  ],
  rome: [
    { id:"r1", title:"Colosseum & Roman Forum",         category:"sightseeing", image:IMGS.sightseeing, description:"Step into ancient Rome at the iconic Colosseum and walk the Roman Forum where history was made for centuries.",      price:20, duration:"3 hours",   emissions:0.3,  rating:4.9, reviews:47000, tags:["UNESCO","Historic","Essential"],            Icon:Building2, featured:true  },
    { id:"r2", title:"Vatican Museums & Sistine Chapel",category:"culture",     image:IMGS.museum,      description:"Marvel at Michelangelo's Sistine Chapel ceiling and explore priceless Vatican collections spanning millennia.",       price:27, duration:"4 hours",   emissions:0.4,  rating:4.8, reviews:38000, tags:["UNESCO","Art","Cultural"],                  Icon:Camera,    featured:false },
    { id:"r3", title:"Villa Borghese Park Cycling",     category:"nature",      image:IMGS.cycling,     description:"Cycle through Rome's most beautiful park — 80 hectares of gardens, sculptures and fountains near the city centre.",  price:15, duration:"2 hours",   emissions:0,    rating:4.7, reviews:4200,  tags:["Zero Emission","Parks","Active"],           Icon:Bike,      featured:false },
    { id:"r4", title:"Trastevere Food & Wine Tour",     category:"food",        image:IMGS.market,      description:"Taste authentic Roman street food and local wine through the charming cobblestone streets of Trastevere.",           price:35, duration:"2.5 hours",emissions:0.05, rating:4.9, reviews:2900,  tags:["Local Food","Wine","Guided"],               Icon:Utensils,  featured:false },
    { id:"r5", title:"Pantheon & Historic Centre Walk", category:"sightseeing", image:IMGS.sightseeing, description:"Explore the Pantheon, Trevi Fountain and Piazza Navona on a guided walking tour of Rome's ancient heart.",          price:18, duration:"3 hours",   emissions:0.1,  rating:4.8, reviews:9800,  tags:["Historic","Guided","Cultural"],             Icon:Building2, featured:false },
    { id:"r6", title:"Appian Way Cycling Day Trip",     category:"adventure",   image:IMGS.cycling,     description:"Cycle along the ancient Appian Way, one of the earliest Roman roads — past catacombs and stunning countryside.",     price:32, duration:"5 hours",   emissions:0,    rating:4.7, reviews:1600,  tags:["Zero Emission","Historic","Active"],        Icon:Bike,      featured:false },
  ],
  barcelona: [
    { id:"bc1", title:"Sagrada Família",                category:"sightseeing", image:IMGS.sightseeing, description:"Visit Gaudí's legendary unfinished basilica — an awe-inspiring fusion of Gothic and Art Nouveau architecture.",      price:28, duration:"2 hours",   emissions:0.3,  rating:4.9, reviews:52000, tags:["UNESCO","Iconic","Architecture"],           Icon:Building2, featured:true  },
    { id:"bc2", title:"Park Güell & Nature Walk",       category:"nature",      image:IMGS.hiking,      description:"Explore Gaudí's colourful hillside park with sweeping views over Barcelona and the Mediterranean Sea.",             price:14, duration:"2 hours",   emissions:0.1,  rating:4.7, reviews:28000, tags:["UNESCO","Gardens","Views"],                 Icon:TreePine,  featured:false },
    { id:"bc3", title:"Gothic Quarter Walking Tour",    category:"culture",     image:IMGS.museum,      description:"Wander through 2,000 years of history in Barcelona's Gothic Quarter with a passionate local guide.",                price:15, duration:"2 hours",   emissions:0.05, rating:4.8, reviews:11000, tags:["Historic","Guided","Cultural"],             Icon:Camera,    featured:false },
    { id:"bc4", title:"La Boqueria & Tapas Tour",       category:"food",        image:IMGS.market,      description:"Explore La Boqueria market then taste your way through Barcelona's best tapas bars with a local food expert.",       price:42, duration:"3 hours",   emissions:0.05, rating:4.9, reviews:6700,  tags:["Local Food","Guided","Sustainable"],        Icon:Utensils,  featured:false },
    { id:"bc5", title:"Barceloneta Beach Cycling",      category:"adventure",   image:IMGS.cycling,     description:"Cycle along the seafront promenade from Barceloneta beach to the Olympic Village — flat, easy and scenic.",          price:12, duration:"2–3 hours", emissions:0,    rating:4.6, reviews:3400,  tags:["Zero Emission","Active","Seafront"],        Icon:Bike,      featured:false },
    { id:"bc6", title:"Montjuïc Castle & Gardens",     category:"sightseeing", image:IMGS.sightseeing, description:"Take the cable car to Montjuïc Castle for panoramic views and explore beautiful botanic gardens.",                  price:10, duration:"3 hours",   emissions:0.2,  rating:4.6, reviews:8900,  tags:["Views","Gardens","Historic"],               Icon:Building2, featured:false },
  ],
  vienna: [
    { id:"v1", title:"Schönbrunn Palace & Gardens",     category:"sightseeing", image:IMGS.sightseeing, description:"Tour the Habsburg imperial palace with 1,441 rooms and wander its vast baroque gardens — a UNESCO site.",            price:22, duration:"3 hours",   emissions:0.3,  rating:4.8, reviews:31000, tags:["UNESCO","Historic","Palaces"],              Icon:Building2, featured:true  },
    { id:"v2", title:"Vienna Woods Hiking",             category:"nature",      image:IMGS.hiking,      description:"Hike through the Wienerwald — a 130 km² forest right on Vienna's doorstep with stunning views of the city.",         price:0,  duration:"3–4 hours", emissions:0.1,  rating:4.8, reviews:4100,  tags:["Free","Nature","Eco-Certified"],            Icon:TreePine,  featured:false },
    { id:"v3", title:"Kunsthistorisches Museum",        category:"culture",     image:IMGS.museum,      description:"One of the world's finest art museums — home to Bruegel, Raphael and Caravaggio in a stunning imperial building.",   price:21, duration:"3 hours",   emissions:0.3,  rating:4.8, reviews:14000, tags:["Art","Imperial","Cultural"],                Icon:Camera,    featured:false },
    { id:"v4", title:"Naschmarkt Food Tour",            category:"food",        image:IMGS.market,      description:"Explore Vienna's beloved open-air market with 120 stalls — organic produce, international street food and local delicacies.", price:20, duration:"2 hours", emissions:0.05, rating:4.8, reviews:7200, tags:["Local Food","Sustainable","Market"],       Icon:Utensils,  featured:false },
    { id:"v5", title:"Prater & Giant Ferris Wheel",     category:"adventure",   image:IMGS.cycling,     description:"Cycle through the Prater park and ride the iconic 1897 Riesenrad — Vienna's giant Ferris wheel with panoramic views.", price:14, duration:"3 hours",   emissions:0.1,  rating:4.7, reviews:9800,  tags:["Active","Historic","Parks"],                Icon:Bike,      featured:false },
    { id:"v6", title:"Belvedere Palace",                category:"sightseeing", image:IMGS.sightseeing, description:"Visit Klimt's famous Kiss and explore baroque palace gardens that are among Europe's finest.",                       price:18, duration:"2.5 hours",emissions:0.2,  rating:4.8, reviews:19500, tags:["Art","Baroque","Gardens"],                  Icon:Building2, featured:false },
  ],
  amsterdam: [
    { id:"am1", title:"Van Gogh Museum",               category:"culture",     image:IMGS.museum,      description:"Home to the world's largest collection of Van Gogh artworks — an unmissable cultural experience in Amsterdam.",       price:22, duration:"2–3 hours", emissions:0.3,  rating:4.8, reviews:19200, tags:["Art","Cultural","Indoor"],                  Icon:Camera,    featured:true  },
    { id:"am2", title:"Canal Boat & Cycling Day",      category:"adventure",   image:IMGS.cycling,     description:"Explore Amsterdam's iconic canals by electric boat, then cycle through the historic Jordaan neighbourhood.",          price:35, duration:"4 hours",   emissions:0.1,  rating:4.7, reviews:4300,  tags:["Zero Emission","Active","Canals"],          Icon:Bike,      featured:false },
    { id:"am3", title:"Rijksmuseum",                   category:"culture",     image:IMGS.museum,      description:"Discover 800 years of Dutch art and history, including Rembrandt and Vermeer masterpieces.",                         price:22, duration:"3 hours",   emissions:0.3,  rating:4.8, reviews:25000, tags:["Art","Historic","UNESCO"],                  Icon:Camera,    featured:false },
    { id:"am4", title:"Anne Frank House",              category:"sightseeing", image:IMGS.sightseeing, description:"Visit the historic hiding place of Anne Frank and learn about one of history's most powerful stories of resilience.", price:16, duration:"2 hours",   emissions:0.2,  rating:4.9, reviews:32000, tags:["Historic","Cultural","Essential"],          Icon:Building2, featured:false },
    { id:"am5", title:"Hortus Botanicus Garden",       category:"nature",      image:IMGS.hiking,      description:"Wander through one of the world's oldest botanical gardens, home to 6,000 plant species.",                          price:11, duration:"2 hours",   emissions:0.05, rating:4.7, reviews:2800,  tags:["Nature","Gardens","Eco-Certified"],         Icon:TreePine,  featured:false },
    { id:"am6", title:"Dutch Street Food Market Tour", category:"food",        image:IMGS.market,      description:"Taste traditional Dutch cheeses, fresh herring and local delicacies on a guided walking food tour.",                 price:28, duration:"2.5 hours",emissions:0.05, rating:4.8, reviews:1900,  tags:["Local Food","Guided","Sustainable"],        Icon:Utensils,  featured:false },
  ],
  brussels: [
    { id:"br1", title:"Grand Place & Historic Centre", category:"sightseeing", image:IMGS.sightseeing, description:"Explore the magnificent Grand Place — Brussels' UNESCO-listed central square, one of Europe's most beautiful.", price:0,  duration:"2 hours",   emissions:0.05, rating:4.9, reviews:22000, tags:["Free","UNESCO","Iconic"],                   Icon:Building2, featured:true  },
    { id:"br2", title:"Atomium & Laeken Park",         category:"sightseeing", image:IMGS.hiking,      description:"Visit the iconic Atomium structure from Expo 58 and explore the beautiful Laeken Royal Park and gardens.",           price:16, duration:"3 hours",   emissions:0.2,  rating:4.7, reviews:8400,  tags:["Architecture","Parks","Unique"],            Icon:Building2, featured:false },
    { id:"br3", title:"Belgian Chocolate Workshop",    category:"food",        image:IMGS.market,      description:"Learn to make Belgian pralines with a master chocolatier — and taste the finest chocolates in the world.",          price:45, duration:"2.5 hours",emissions:0.1,  rating:4.9, reviews:3200,  tags:["Hands-On","Local Food","Unique"],           Icon:Utensils,  featured:false },
    { id:"br4", title:"Marolles Flea Market Tour",     category:"food",        image:IMGS.market,      description:"Explore the legendary Marolles flea market — 500 stalls of antiques and street food in a vibrant neighbourhood.",   price:0,  duration:"2 hours",   emissions:0.05, rating:4.7, reviews:4100,  tags:["Free","Local","Weekend"],                   Icon:Utensils,  featured:false },
    { id:"br5", title:"Sonian Forest Cycling",         category:"nature",      image:IMGS.cycling,     description:"Cycle through the vast Sonian Forest — 4,400 hectares of ancient beech woodland on Brussels' doorstep.",           price:15, duration:"3 hours",   emissions:0,    rating:4.8, reviews:2600,  tags:["Zero Emission","Forest","Active"],          Icon:Bike,      featured:false },
    { id:"br6", title:"Magritte Museum",               category:"culture",     image:IMGS.museum,      description:"Explore the world's largest collection of works by surrealist master René Magritte in elegant Royal Brussels.",      price:16, duration:"2 hours",   emissions:0.2,  rating:4.7, reviews:9100,  tags:["Art","Surrealism","Cultural"],              Icon:Camera,    featured:false },
  ],
  edinburgh: [
    { id:"ed1", title:"Edinburgh Castle",              category:"sightseeing", image:IMGS.sightseeing, description:"Explore Scotland's most iconic castle — perched on volcanic rock with panoramic views over the city and beyond.",    price:20, duration:"3 hours",   emissions:0.3,  rating:4.8, reviews:27000, tags:["Historic","Iconic","Views"],                Icon:Building2, featured:true  },
    { id:"ed2", title:"Arthur's Seat Hike",            category:"nature",      image:IMGS.hiking,      description:"Hike to the summit of Arthur's Seat — Edinburgh's extinct volcano — for stunning 360° views over the city.",         price:0,  duration:"2–3 hours", emissions:0.1,  rating:4.9, reviews:14000, tags:["Free","Hiking","Nature"],                   Icon:TreePine,  featured:false },
    { id:"ed3", title:"Royal Mile Walking Tour",       category:"culture",     image:IMGS.sightseeing, description:"Explore Edinburgh's most famous street from the Castle to Holyrood Palace on a guided history walking tour.",        price:15, duration:"2 hours",   emissions:0.05, rating:4.8, reviews:11200, tags:["Historic","Guided","Cultural"],             Icon:Camera,    featured:false },
    { id:"ed4", title:"Scottish Whisky Tasting",       category:"food",        image:IMGS.market,      description:"Sample five single malts with an expert at a traditional whisky bar in the heart of the Old Town.",                 price:38, duration:"2 hours",   emissions:0.05, rating:4.9, reviews:4600,  tags:["Whisky","Local","Cultural"],                Icon:Utensils,  featured:false },
    { id:"ed5", title:"Pentland Hills Cycling",        category:"adventure",   image:IMGS.cycling,     description:"Cycle into the Pentland Hills Regional Park — open moorland and reservoirs just 30 minutes from Edinburgh.",         price:18, duration:"3–4 hours", emissions:0,    rating:4.7, reviews:1800,  tags:["Zero Emission","Hills","Active"],           Icon:Bike,      featured:false },
    { id:"ed6", title:"National Museum of Scotland",   category:"culture",     image:IMGS.museum,      description:"Free entry to Scotland's national museum — 12,000 objects telling the story of Scotland and the wider world.",       price:0,  duration:"3 hours",   emissions:0.1,  rating:4.8, reviews:19000, tags:["Free","Cultural","Historic"],               Icon:Camera,    featured:false },
  ],
  zurich: [
    { id:"z1", title:"Lake Zurich Sailing & Swimming", category:"adventure",   image:IMGS.kayak,       description:"Sail on Lake Zurich and swim from the Seebad Enge — swimming from city lakes is a beloved Zurich tradition.",        price:22, duration:"3 hours",   emissions:0.1,  rating:4.8, reviews:5100,  tags:["Active","Lake","Eco-Friendly"],             Icon:Waves,     featured:true  },
    { id:"z2", title:"Swiss National Museum",          category:"culture",     image:IMGS.museum,      description:"Explore 1,000 years of Swiss history and culture in a stunning castle-like building in the heart of Zurich.",        price:10, duration:"2–3 hours", emissions:0.2,  rating:4.7, reviews:7200,  tags:["History","Cultural","Indoor"],              Icon:Camera,    featured:false },
    { id:"z3", title:"Uetliberg Mountain Hike",        category:"nature",      image:IMGS.hiking,      description:"Hike up Zurich's own mountain — the Uetliberg — for panoramic views of the Alps and Lake Zurich.",                  price:0,  duration:"3–4 hours", emissions:0.1,  rating:4.8, reviews:9300,  tags:["Free","Hiking","Alpine Views"],             Icon:TreePine,  featured:false },
    { id:"z4", title:"Zurich Old Town Walking Tour",   category:"sightseeing", image:IMGS.sightseeing, description:"Explore the medieval Altstadt with its guild houses, twin-towered Grossmünster and narrow cobbled lanes.",           price:18, duration:"2 hours",   emissions:0.05, rating:4.7, reviews:6400,  tags:["Historic","Guided","Medieval"],             Icon:Building2, featured:false },
    { id:"z5", title:"Zurich Street Food Market",      category:"food",        image:IMGS.market,      description:"Visit Helvetiaplatz or the Frau Gerolds Garten food market for Swiss cheeses, local wines and artisan produce.",    price:0,  duration:"2 hours",   emissions:0.05, rating:4.8, reviews:3100,  tags:["Local Food","Free","Weekend"],              Icon:Utensils,  featured:false },
    { id:"z6", title:"Rhine Falls Day Trip",           category:"adventure",   image:IMGS.kayak,       description:"Take the train to Europe's largest waterfall just 40 minutes away — spectacular Rhine Falls at Schaffhausen.",       price:12, duration:"Full Day",   emissions:0.5,  rating:4.9, reviews:12000, tags:["Day Trip","Nature","Scenic"],               Icon:Waves,     featured:false },
  ],
  lisbon: [
    { id:"li1", title:"Alfama Tram & Walking Tour",    category:"culture",     image:IMGS.sightseeing, description:"Ride the historic Tram 28 through Alfama's winding streets then explore this ancient Moorish neighbourhood on foot.", price:20, duration:"3 hours",   emissions:0.2,  rating:4.8, reviews:13000, tags:["Historic","Guided","Iconic"],               Icon:Camera,    featured:true  },
    { id:"li2", title:"Sintra Palaces Day Trip",       category:"sightseeing", image:IMGS.sightseeing, description:"Explore the magical palaces and gardens of Sintra — a UNESCO World Heritage site 40 minutes from Lisbon.",           price:28, duration:"Full Day",   emissions:0.8,  rating:4.9, reviews:21000, tags:["UNESCO","Day Trip","Palaces"],              Icon:Building2, featured:false },
    { id:"li3", title:"Tejo River Kayak",              category:"adventure",   image:IMGS.kayak,       description:"Paddle along the Tagus River past iconic Lisbon landmarks — the Belém Tower and the 25 de Abril Bridge.",            price:35, duration:"2.5 hours",emissions:0.1,  rating:4.7, reviews:2400,  tags:["Active","River View","Eco-Friendly"],       Icon:Waves,     featured:false },
    { id:"li4", title:"Mercado da Ribeira Food Tour",  category:"food",        image:IMGS.market,      description:"Taste Portugal's finest — pastéis de nata, seafood, wine and more at Lisbon's famous Time Out Market.",             price:25, duration:"2 hours",   emissions:0.05, rating:4.8, reviews:8900,  tags:["Local Food","Market","Sustainable"],        Icon:Utensils,  featured:false },
    { id:"li5", title:"Monsanto Forest Park Cycling",  category:"nature",      image:IMGS.cycling,     description:"Cycle through Lisbon's 'lung' — the 900-hectare Monsanto forest park with stunning viewpoints over the city.",       price:14, duration:"3 hours",   emissions:0,    rating:4.7, reviews:3100,  tags:["Zero Emission","Forest","Active"],          Icon:Bike,      featured:false },
    { id:"li6", title:"Azulejo Tile Painting Workshop",category:"culture",     image:IMGS.museum,      description:"Create your own traditional Portuguese azulejo tiles in a hands-on workshop in the heart of historic Lisbon.",        price:40, duration:"2 hours",   emissions:0.05, rating:4.8, reviews:2700,  tags:["Hands-On","Cultural","Unique"],             Icon:Camera,    featured:false },
  ],
  glasgow: [
    { id:"g1", title:"Kelvingrove Art Gallery",        category:"culture",     image:IMGS.museum,      description:"Free entry to one of Scotland's finest museums — home to Van Gogh, Dalí and more in a stunning Victorian building.", price:0,  duration:"3 hours",   emissions:0.1,  rating:4.8, reviews:16000, tags:["Free","Art","Victorian"],                   Icon:Camera,    featured:true  },
    { id:"g2", title:"Kelvin Walkway & Riverside Trail",category:"nature",     image:IMGS.hiking,      description:"Walk the River Kelvin from Kelvingrove Park to Milngavie — a beautiful 16 km green corridor through Glasgow.",       price:0,  duration:"4–5 hours", emissions:0.05, rating:4.7, reviews:3200,  tags:["Free","River Walk","Eco-Friendly"],         Icon:TreePine,  featured:false },
    { id:"g3", title:"Glasgow Cathedral & Necropolis", category:"sightseeing", image:IMGS.sightseeing, description:"Explore Scotland's only complete medieval cathedral then walk the adjacent Victorian necropolis with city views.",    price:0,  duration:"2 hours",   emissions:0.05, rating:4.7, reviews:7400,  tags:["Free","Medieval","Historic"],               Icon:Building2, featured:false },
    { id:"g4", title:"Glasgow Street Food Tour",       category:"food",        image:IMGS.market,      description:"Taste Glasgow's vibrant street food scene — from Scottish pies to international cuisine in the Merchant City.",       price:22, duration:"2 hours",   emissions:0.05, rating:4.6, reviews:1900,  tags:["Local Food","Guided","Weekend"],            Icon:Utensils,  featured:false },
    { id:"g5", title:"Loch Lomond Day Trip",           category:"nature",      image:IMGS.hiking,      description:"Day trip to Loch Lomond — Scotland's largest loch and Trossachs National Park, just 30 minutes from Glasgow.",      price:20, duration:"Full Day",   emissions:0.6,  rating:4.9, reviews:11000, tags:["National Park","Day Trip","Scenic"],        Icon:TreePine,  featured:false },
    { id:"g6", title:"Riverside Museum",               category:"culture",     image:IMGS.museum,      description:"Free entry to Glasgow's award-winning transport museum on the Clyde — perfect for all ages and weather.",            price:0,  duration:"2.5 hours",emissions:0.1,  rating:4.8, reviews:12000, tags:["Free","Transport","Family"],                Icon:Camera,    featured:false },
  ],
  cologne: [
    { id:"co1", title:"Cologne Cathedral",             category:"sightseeing", image:IMGS.sightseeing, description:"Climb the 533 steps of Cologne's magnificent UNESCO cathedral for sweeping Rhine valley views.",                     price:6,  duration:"2 hours",   emissions:0.1,  rating:4.9, reviews:41000, tags:["UNESCO","Iconic","Views"],                  Icon:Building2, featured:true  },
    { id:"co2", title:"Rhine Cycling Trail",           category:"adventure",   image:IMGS.cycling,     description:"Cycle along the Rhine from Cologne through vineyards and historic towns — flat, scenic and eco-friendly.",           price:16, duration:"4–5 hours", emissions:0,    rating:4.8, reviews:5200,  tags:["Zero Emission","Rhine","Active"],           Icon:Bike,      featured:false },
    { id:"co3", title:"Museum Ludwig",                 category:"culture",     image:IMGS.museum,      description:"Explore one of Europe's most important modern art museums — home to one of the largest Picasso collections outside Spain.", price:13, duration:"2–3 hours", emissions:0.2, rating:4.8, reviews:9800, tags:["Modern Art","Cultural","Indoor"],         Icon:Camera,    featured:false },
    { id:"co4", title:"Ehrenfeld Food Market Tour",    category:"food",        image:IMGS.market,      description:"Discover Cologne's coolest neighbourhood — Ehrenfeld's street food markets, craft beer bars and artisan producers.",  price:18, duration:"2 hours",   emissions:0.05, rating:4.7, reviews:2300,  tags:["Local Food","Craft Beer","Guided"],         Icon:Utensils,  featured:false },
    { id:"co5", title:"Stadtwald Forest Walk",         category:"nature",      image:IMGS.hiking,      description:"Stroll through Cologne's 200-hectare Stadtwald city forest — a peaceful green escape with meadows and wildlife.",    price:0,  duration:"2–3 hours", emissions:0.05, rating:4.7, reviews:4100,  tags:["Free","Forest","Eco-Friendly"],             Icon:TreePine,  featured:false },
    { id:"co6", title:"Romano-Germanic Museum",        category:"culture",     image:IMGS.museum,      description:"Walk through 2,000 years of Roman history — Cologne was a major Roman city and this museum preserves its legacy.",   price:12, duration:"2 hours",   emissions:0.1,  rating:4.7, reviews:7600,  tags:["Roman History","Cultural","UNESCO"],        Icon:Camera,    featured:false },
  ],
  birmingham: [
    { id:"bm1", title:"Cadbury World",                 category:"culture",     image:IMGS.museum,      description:"Explore the history of chocolate at the famous Cadbury factory in Bournville — a sweet experience for all ages.",    price:22, duration:"3 hours",   emissions:0.3,  rating:4.7, reviews:14000, tags:["Family","Food","Unique"],                   Icon:Camera,    featured:true  },
    { id:"bm2", title:"Jewellery Quarter Walking Tour",category:"culture",     image:IMGS.sightseeing, description:"Explore Birmingham's world-famous Jewellery Quarter — 700+ businesses in a Victorian streetscape full of history.",  price:12, duration:"2 hours",   emissions:0.05, rating:4.6, reviews:3200,  tags:["Historic","Craft","Guided"],                Icon:Camera,    featured:false },
    { id:"bm3", title:"Canals & Brindleyplace Walk",   category:"nature",      image:IMGS.hiking,      description:"Walk Birmingham's famous canal network — more canals than Venice — through the vibrant Brindleyplace waterfront.",   price:0,  duration:"2 hours",   emissions:0.05, rating:4.7, reviews:6100,  tags:["Free","Canals","Scenic"],                   Icon:TreePine,  featured:false },
    { id:"bm4", title:"Balti Triangle Food Tour",      category:"food",        image:IMGS.market,      description:"Taste Birmingham's most famous culinary contribution — the Balti — on a guided tour of the legendary Balti Triangle.", price:28, duration:"3 hours",  emissions:0.05, rating:4.9, reviews:4800,  tags:["Local Food","Balti","Guided"],              Icon:Utensils,  featured:false },
    { id:"bm5", title:"Lickey Hills Country Park",     category:"nature",      image:IMGS.hiking,      description:"Hike through Lickey Hills Country Park — 524 acres of woodland just 10 miles south of Birmingham city centre.",       price:0,  duration:"3 hours",   emissions:0.1,  rating:4.7, reviews:5300,  tags:["Free","Hiking","Country Park"],             Icon:TreePine,  featured:false },
    { id:"bm6", title:"Birmingham Museum & Art Gallery",category:"culture",    image:IMGS.museum,      description:"Free entry to Birmingham's finest museum — including the world's largest collection of Pre-Raphaelite art.",         price:0,  duration:"3 hours",   emissions:0.1,  rating:4.8, reviews:11000, tags:["Free","Art","Cultural"],                    Icon:Camera,    featured:false },
  ],
  manchester: [
    { id:"mc1", title:"Museum of Science & Industry",  category:"culture",     image:IMGS.museum,      description:"Free exploration of the birthplace of the industrial revolution in a stunning Victorian station complex.",           price:0,  duration:"3 hours",   emissions:0.1,  rating:4.8, reviews:12000, tags:["Free","Industrial","Cultural"],             Icon:Camera,    featured:true  },
    { id:"mc2", title:"Castlefield Urban Heritage Park",category:"nature",     image:IMGS.hiking,      description:"Walk through Castlefield — a Roman fort and world's first railway terminus turned canal basin and urban park.",       price:0,  duration:"2 hours",   emissions:0.05, rating:4.7, reviews:5200,  tags:["Free","Canals","Historic"],                 Icon:TreePine,  featured:false },
    { id:"mc3", title:"Northern Quarter Street Art Tour",category:"culture",   image:IMGS.market,      description:"Discover Manchester's vibrant Northern Quarter — indie cafes, record shops and incredible street murals.",           price:15, duration:"2 hours",   emissions:0.05, rating:4.7, reviews:2900,  tags:["Street Art","Cultural","Guided"],           Icon:Camera,    featured:false },
    { id:"mc4", title:"Manchester Food Tour",          category:"food",        image:IMGS.market,      description:"Taste Manchester's multicultural food scene — from Curry Mile to craft beer bars in a guided culinary adventure.",   price:32, duration:"3 hours",   emissions:0.05, rating:4.8, reviews:3600,  tags:["Local Food","Multicultural","Guided"],      Icon:Utensils,  featured:false },
    { id:"mc5", title:"Peak District Day Trip Hike",   category:"nature",      image:IMGS.hiking,      description:"Day trip to the Peak District — stunning moorland, stone villages and dramatic gritstone edges just 45 min away.",   price:15, duration:"Full Day",   emissions:0.5,  rating:4.9, reviews:9400,  tags:["National Park","Day Trip","Hiking"],        Icon:TreePine,  featured:false },
    { id:"mc6", title:"Manchester Art Gallery",        category:"culture",     image:IMGS.museum,      description:"Free entry to one of the UK's finest regional art galleries with an outstanding Pre-Raphaelite collection.",         price:0,  duration:"2.5 hours",emissions:0.1,  rating:4.7, reviews:8100,  tags:["Free","Art","Cultural"],                    Icon:Camera,    featured:false },
  ],
  frankfurt: [
    { id:"f1", title:"Römerberg Old Town Walk",        category:"sightseeing", image:IMGS.sightseeing, description:"Explore Frankfurt's beautifully reconstructed medieval old town around the iconic Römer — the city's historic heart.", price:0,  duration:"2 hours",   emissions:0.05, rating:4.7, reviews:14000, tags:["Free","Historic","Medieval"],               Icon:Building2, featured:true  },
    { id:"f2", title:"Main River Cycling Trail",       category:"adventure",   image:IMGS.cycling,     description:"Cycle along the Main riverbank through Frankfurt — a flat, beautiful route past museums and riverside cafes.",         price:14, duration:"3 hours",   emissions:0,    rating:4.7, reviews:4200,  tags:["Zero Emission","Riverside","Active"],       Icon:Bike,      featured:false },
    { id:"f3", title:"Städel Museum",                  category:"culture",     image:IMGS.museum,      description:"One of Germany's most important art museums — 700 years of European art from the Middle Ages to contemporary works.", price:18, duration:"3 hours",   emissions:0.2,  rating:4.8, reviews:11000, tags:["Art","Cultural","Historic"],                Icon:Camera,    featured:false },
    { id:"f4", title:"Kleinmarkthalle Food Tour",      category:"food",        image:IMGS.market,      description:"Explore Frankfurt's beloved indoor market — local cheeses, Äppelwoi cider, Grüne Soße and international produce.",   price:0,  duration:"2 hours",   emissions:0.05, rating:4.8, reviews:6800,  tags:["Free","Local Food","Market"],               Icon:Utensils,  featured:false },
    { id:"f5", title:"Taunus Hiking Day Trip",         category:"nature",      image:IMGS.hiking,      description:"Day trip to the Taunus hills — forested mountains north of Frankfurt with hiking trails and a spa town.",            price:18, duration:"Full Day",   emissions:0.5,  rating:4.8, reviews:3700,  tags:["Hiking","Nature","Day Trip"],               Icon:TreePine,  featured:false },
    { id:"f6", title:"European Central Bank Tower",    category:"sightseeing", image:IMGS.sightseeing, description:"View Frankfurt's famous skyline from across the Main — one of Europe's most dramatic urban landscapes.",            price:0,  duration:"1 hour",    emissions:0.05, rating:4.5, reviews:5100,  tags:["Free","Architecture","Views"],              Icon:Building2, featured:false },
  ],
  prague: [
    { id:"pr1", title:"Prague Castle & St. Vitus",     category:"sightseeing", image:IMGS.sightseeing, description:"Explore the world's largest ancient castle complex — home to St. Vitus Cathedral and breathtaking city views.",     price:15, duration:"4 hours",   emissions:0.3,  rating:4.9, reviews:38000, tags:["UNESCO","Historic","Castle"],               Icon:Building2, featured:true  },
    { id:"pr2", title:"Charles Bridge at Sunrise",     category:"sightseeing", image:IMGS.sightseeing, description:"Walk the 650-year-old Charles Bridge at dawn — 30 baroque statues and misty views over the Vltava River.",         price:0,  duration:"2 hours",   emissions:0.05, rating:4.9, reviews:29000, tags:["Free","Iconic","Sunrise"],                  Icon:Building2, featured:false },
    { id:"pr3", title:"Czech Beer & Food Tour",        category:"food",        image:IMGS.market,      description:"Taste the world's finest beer at Prague's traditional pubs, with local food pairings and a passionate guide.",       price:35, duration:"3 hours",   emissions:0.05, rating:4.8, reviews:6700,  tags:["Beer","Local Food","Guided"],               Icon:Utensils,  featured:false },
    { id:"pr4", title:"Vltava River Kayak",            category:"adventure",   image:IMGS.kayak,       description:"Paddle along the Vltava River through the heart of historic Prague — a unique water-level view of the city.",        price:28, duration:"2.5 hours",emissions:0.1,  rating:4.7, reviews:3100,  tags:["Active","River View","Eco-Friendly"],       Icon:Waves,     featured:false },
    { id:"pr5", title:"Old Jewish Quarter Walk",       category:"culture",     image:IMGS.museum,      description:"Explore Josefov — Prague's hauntingly beautiful Jewish Quarter with 6 synagogues and the Old Jewish Cemetery.",      price:18, duration:"2 hours",   emissions:0.1,  rating:4.8, reviews:14000, tags:["Historic","Cultural","Essential"],          Icon:Camera,    featured:false },
    { id:"pr6", title:"Stromovka Park Cycling",        category:"nature",      image:IMGS.cycling,     description:"Cycle through Stromovka — Prague's oldest royal park and a beloved green haven just minutes from the city centre.",  price:10, duration:"2 hours",   emissions:0,    rating:4.7, reviews:2800,  tags:["Zero Emission","Parks","Active"],           Icon:Bike,      featured:false },
  ],
  madrid: [
    { id:"md1", title:"Prado Museum",                  category:"culture",     image:IMGS.museum,      description:"One of the world's greatest art museums — Velázquez, Goya, Rubens and El Greco in Madrid's cultural crown jewel.",   price:15, duration:"3–4 hours", emissions:0.3,  rating:4.9, reviews:42000, tags:["Art","Cultural","Essential"],               Icon:Camera,    featured:true  },
    { id:"md2", title:"Retiro Park Cycling",           category:"nature",      image:IMGS.cycling,     description:"Cycle through Madrid's magnificent 350-acre Retiro Park — a green oasis with a boating lake in the city centre.",    price:12, duration:"2–3 hours", emissions:0,    rating:4.8, reviews:8100,  tags:["Zero Emission","Parks","Active"],           Icon:Bike,      featured:false },
    { id:"md3", title:"Mercado San Miguel",            category:"food",        image:IMGS.market,      description:"Taste your way through Madrid's iconic iron-and-glass market — 33 stalls of finest Spanish tapas, wine and cheese.", price:0,  duration:"2 hours",   emissions:0.05, rating:4.7, reviews:19000, tags:["Free Entry","Tapas","Local"],               Icon:Utensils,  featured:false },
    { id:"md4", title:"Royal Palace of Madrid",        category:"sightseeing", image:IMGS.sightseeing, description:"Tour the official residence of the Spanish Royal Family — 3,418 rooms and stunning baroque architecture.",          price:14, duration:"2.5 hours",emissions:0.2,  rating:4.8, reviews:24000, tags:["Royal","Historic","Architecture"],          Icon:Building2, featured:false },
    { id:"md5", title:"El Escorial Day Trip",          category:"sightseeing", image:IMGS.hiking,      description:"Visit Philip II's extraordinary monastery-palace complex in the Sierra de Guadarrama mountains.",                   price:22, duration:"Full Day",   emissions:0.6,  rating:4.7, reviews:9200,  tags:["UNESCO","Day Trip","Mountains"],            Icon:Building2, featured:false },
    { id:"md6", title:"Rastro Flea Market Walk",       category:"culture",     image:IMGS.market,      description:"Explore Europe's largest open-air flea market every Sunday in La Latina — antiques, art and Madrid street life.",    price:0,  duration:"2–3 hours", emissions:0.05, rating:4.6, reviews:12000, tags:["Free","Market","Weekend"],                  Icon:Camera,    featured:false },
  ],
};

/* Curated multi-city showcase for browse mode (no trip booked).
   2 activities per city — deduplicated, one per category where possible. */
const GENERAL_SHOWCASE = (() => {
  const seen = new Set();
  return Object.values(CITY_ACTIVITIES).flatMap((acts) =>
    acts.filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    }).slice(0, 2)
  );
})();

const ACTIVITIES = [
  {
    id: 1,
    title: "Versailles Palace & Gardens",
    category: "sightseeing",
    image: IMGS.sightseeing,
    description: "Explore the magnificent Palace of Versailles and its stunning gardens, a UNESCO World Heritage site.",
    price: 22,
    duration: "Full Day",
    emissions: 0.8,
    rating: 4.9,
    reviews: 18420,
    tags: ["UNESCO", "Historic", "Gardens"],
    Icon: Building2,
    featured: false,
  },
  {
    id: 2,
    title: "Forest Hiking in Fontainebleau",
    category: "nature",
    image: IMGS.hiking,
    description: "Trek through the ancient Fontainebleau forest, home to diverse wildlife and stunning sandstone formations.",
    price: 0,
    duration: "4–6 hours",
    emissions: 0.1,
    rating: 4.8,
    reviews: 3210,
    tags: ["Free Entry", "Wildlife", "Eco-Certified"],
    Icon: TreePine,
    featured: true,
  },
  {
    id: 3,
    title: "Louvre Museum Tour",
    category: "culture",
    image: IMGS.museum,
    description: "Discover world-class art and artefacts spanning thousands of years at the world's largest art museum.",
    price: 17,
    duration: "3–4 hours",
    emissions: 0.3,
    rating: 4.7,
    reviews: 42100,
    tags: ["Skip-the-Line", "Cultural", "Indoor"],
    Icon: Camera,
    featured: false,
  },
  {
    id: 4,
    title: "Local Farmers' Market Tour",
    category: "food",
    image: IMGS.market,
    description: "Explore authentic Parisian food markets, taste local produce, and learn about sustainable French gastronomy.",
    price: 12,
    duration: "2 hours",
    emissions: 0.05,
    rating: 4.9,
    reviews: 1870,
    tags: ["Local Food", "Sustainable", "Guided"],
    Icon: Utensils,
    featured: false,
  },
  {
    id: 5,
    title: "Seine River Kayak Adventure",
    category: "adventure",
    image: IMGS.kayak,
    description: "Paddle along the Seine and take in iconic Parisian landmarks from a unique water-level perspective.",
    price: 45,
    duration: "3 hours",
    emissions: 0.2,
    rating: 4.6,
    reviews: 940,
    tags: ["Outdoor", "Active", "River View"],
    Icon: Heart,
    featured: false,
  },
  {
    id: 6,
    title: "City Cycling Tour",
    category: "adventure",
    image: IMGS.cycling,
    description: "Explore Paris on two wheels with an expert guide, covering hidden gems and iconic neighbourhoods.",
    price: 28,
    duration: "3 hours",
    emissions: 0,
    rating: 4.8,
    reviews: 5430,
    tags: ["Zero Emission", "Active", "Guided"],
    Icon: Bike,
    featured: false,
  },
];

const CATEGORIES = [
  { id: "all",         label: "All",         emoji: "✨" },
  { id: "nature",      label: "Nature",      emoji: "🌿" },
  { id: "culture",     label: "Culture",     emoji: "🎨" },
  { id: "sightseeing", label: "Sightseeing", emoji: "🏛️" },
  { id: "food",        label: "Food",        emoji: "🍽️" },
  { id: "adventure",   label: "Adventure",   emoji: "🚵" },
];

/* ─────────────────────────────────────────
   ACTIVITY CARD
───────────────────────────────────────── */
function ActivityCard({ activity, isSelected, isWishlisted, onSelect, onWishlist, canSelect = true }) {
  const Icon = activity.Icon ?? MapPin;
  const priceLabel = activity.price === 0 ? "Free" : `£${activity.price}`;
  const co2Label = activity.emissions === 0 ? "Zero kg CO₂" : `${activity.emissions} kg CO₂`;
  const imgSrc = activity.image ?? STOCK_PHOTOS[activity.category] ?? STOCK_PHOTOS.default;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "1.25rem",
        overflow: "hidden",
        boxShadow: isSelected
          ? "0 0 0 2.5px #2d7a4f, 0 8px 30px rgba(45,122,79,0.14)"
          : "0 4px 20px rgba(0,0,0,0.07)",
        transition: "box-shadow 0.2s, transform 0.2s",
        cursor: "default",
      }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.transform = "translateY(-3px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {/* ── Image area ── */}
      <div style={{ position: "relative", height: "11.5rem", overflow: "hidden" }}>
        <img
          src={imgSrc}
          alt={activity.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.5s" }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        />

        {/* Excellent eco badge — top left */}
        <div
          style={{
            position: "absolute",
            top: "0.625rem",
            left: "0.625rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            padding: "0.25rem 0.625rem",
            borderRadius: "9999px",
            background: "#dcfce7",
            border: "1px solid #86efac",
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "#166534",
            fontFamily: "'Inter',sans-serif",
          }}
        >
          <Leaf style={{ width: "0.65rem", height: "0.65rem" }} />
          Excellent
        </div>

        {/* Featured badge (only for Forest Hiking) */}
        {activity.featured && (
          <div
            style={{
              position: "absolute",
              top: "0.625rem",
              left: "5.5rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.2rem",
              padding: "0.25rem 0.625rem",
              borderRadius: "9999px",
              background: "#fef9c3",
              border: "1px solid #fde047",
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "#854d0e",
              fontFamily: "'Inter',sans-serif",
            }}
          >
            ⭐ Featured
          </div>
        )}

        {/* Heart / wishlist button — top right */}
        <button
          onClick={() => onWishlist(activity.id)}
          style={{
            position: "absolute",
            top: "0.625rem",
            right: "0.625rem",
            width: "2rem",
            height: "2rem",
            borderRadius: "50%",
            background: isWishlisted ? "#ef4444" : "rgba(255,255,255,0.92)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            transition: "background 0.15s",
          }}
        >
          <Heart
            style={{
              width: "0.875rem",
              height: "0.875rem",
              color: isWishlisted ? "#fff" : "#6b7280",
              fill: isWishlisted ? "#fff" : "none",
            }}
          />
        </button>

        {/* Price — bottom right */}
        <div
          style={{
            position: "absolute",
            bottom: "0.625rem",
            right: "0.625rem",
            padding: "0.3rem 0.75rem",
            borderRadius: "0.625rem",
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
          }}
        >
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.875rem", fontFamily: "'Inter',sans-serif" }}>
            {priceLabel}
          </span>
        </div>
      </div>

      {/* ── Card content ── */}
      <div style={{ padding: "1.125rem 1.25rem 1.25rem" }}>
        {/* Category + Duration row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <Icon style={{ width: "0.8rem", height: "0.8rem", color: "#2d7a4f" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2d7a4f", fontFamily: "'Inter',sans-serif", textTransform: "capitalize" }}>
              {activity.category}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <Clock style={{ width: "0.8rem", height: "0.8rem", color: "#9ca3af" }} />
            <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif" }}>{activity.duration}</span>
          </div>
        </div>

        {/* Title */}
        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1a2e1a", marginBottom: "0.5rem", fontFamily: "'Inter',sans-serif", lineHeight: 1.3 }}>
          {activity.title}
        </h3>

        {/* Description */}
        <p style={{ fontSize: "0.8rem", color: "#6b7280", lineHeight: 1.65, marginBottom: "0.75rem", fontFamily: "'Inter',sans-serif" }}>
          {activity.description}
        </p>

        {/* Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "0.875rem" }}>
          {activity.tags.map((tag) => (
            <span
              key={tag}
              style={{
                padding: "0.2rem 0.625rem",
                borderRadius: "9999px",
                background: "#f3f4f6",
                color: "#4b5563",
                fontSize: "0.72rem",
                fontWeight: 500,
                fontFamily: "'Inter',sans-serif",
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Rating + CO₂ */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <Star style={{ width: "0.875rem", height: "0.875rem", color: "#facc15", fill: "#facc15" }} />
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1a2e1a", fontFamily: "'Inter',sans-serif" }}>
              {activity.rating}
            </span>
            <span style={{ fontSize: "0.72rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif" }}>
              ({activity.reviews.toLocaleString()})
            </span>
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              padding: "0.2rem 0.625rem",
              borderRadius: "0.5rem",
              background: "#e8f5ee",
              color: "#2d7a4f",
              fontSize: "0.72rem",
              fontWeight: 600,
              fontFamily: "'Inter',sans-serif",
            }}
          >
            <Leaf style={{ width: "0.65rem", height: "0.65rem" }} />
            {co2Label}
          </div>
        </div>

        {/* Add to Itinerary button — locked in browse mode */}
        {canSelect ? (
          <button
            onClick={() => onSelect(activity.id)}
            style={{
              width: "100%",
              padding: "0.7rem",
              borderRadius: "0.875rem",
              border: `2px solid ${isSelected ? "#2d7a4f" : "#4aab74"}`,
              background: isSelected ? "#2d7a4f" : "transparent",
              color: isSelected ? "#fff" : "#2d7a4f",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Inter',sans-serif",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {isSelected
              ? <><CheckCircle2 style={{ width: "1rem", height: "1rem" }} /> Added to Itinerary</>
              : <><Plus style={{ width: "1rem", height: "1rem" }} /> Add to Itinerary</>
            }
          </button>
        ) : (
          <div style={{
            width: "100%", padding: "0.7rem",
            borderRadius: "0.875rem", border: "2px dashed #d1d5db",
            background: "#f9fafb", color: "#9ca3af",
            fontSize: "0.8rem", fontWeight: 600,
            fontFamily: "'Inter',sans-serif",
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: "0.4rem",
            boxSizing: "border-box",
          }}>
            🔒 Book a trip to add
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   PAGE
───────────────────────────────────────── */
export function ActivitiesPage() {
  const navigate = useNavigate();
  const { trip, toggleActivity } = useTrip();

  /* "Trip booked" = user has searched a destination */
  const hasTrip     = !!(trip.to);
  const destination = trip.to || "";

  const [activeCategory, setActiveCategory] = useState("all");
  const [activities,     setActivities]      = useState(() => {
    if (!hasTrip) return GENERAL_SHOWCASE;
    const cityKey  = destination.trim().toLowerCase();
    return CITY_ACTIVITIES[cityKey] ?? ACTIVITIES;
  });
  const [loading,     setLoading]     = useState(false);
  const [dataSource,  setDataSource]  = useState(hasTrip ? "static" : "general");
  const [loadError,   setLoadError]   = useState("");
  const [wishlistIds, setWishlistIds] = useState(
    () => trip.savedActivities.map((a) => a.id)
  );

  /* ── Fetch activities for the destination ── */
  const fetchActivities = useCallback(async (cat = "all") => {
    setLoading(true);
    setLoadError("");
    try {
      /* 1. Google Places — live data */
      const places = await searchActivitiesNear(destination, cat);
      if (places.length > 0) {
        setActivities(places);
        setDataSource("places");
        return;
      }
      throw new Error("No Places results");
    } catch {
      /* 2. OpenAI GPT-4o mini fallback */
      try {
        const aiResult = await getEcoActivities({ destination, category: cat, count: 15 });
        if (aiResult?.activities?.length) {
          setActivities(aiResult.activities.map((a, i) => {
            const cat2 = a.category ?? "sightseeing";
            return {
              id:          a.id ?? `ai-${i}`,
              title:       a.title,
              category:    cat2,
              image:       STOCK_PHOTOS[cat2] ?? STOCK_PHOTOS.default,
              description: a.description,
              price:       a.price_gbp ?? 0,
              duration:    a.duration ?? "2–3 hours",
              emissions:   a.emissions_kg ?? 0.2,
              rating:      a.rating ?? 4.5,
              reviews:     a.reviews ?? 0,
              tags:        a.eco_tags ?? ["Eco-Friendly", "Local"],
              eco_score:   a.eco_score ?? 90,
              featured:    a.featured ?? false,
              Icon:        CAT_ICONS[cat2] ?? CAT_ICONS.default,
            };
          }));
          setDataSource("ai");
          return;
        }
        throw new Error("Empty AI response");
      } catch {
        /* 3. City-specific static bank — rich pre-built data per destination */
        const cityKey = destination.trim().toLowerCase();
        const cityData = CITY_ACTIVITIES[cityKey];
        if (cityData && cityData.length > 0) {
          const filtered2 = cat === "all" ? cityData : cityData.filter((a) => a.category === cat);
          setActivities(filtered2.length > 0 ? filtered2 : cityData);
          setDataSource("static");
          return;
        }
        /* 4. Generic fallback — relabelled static activities */
        setActivities(ACTIVITIES.map((a) => ({
          ...a,
          description: a.description.replace(/Paris|Versailles|Seine|Fontainebleau|Parisian|Louvre/gi, destination),
        })));
        setDataSource("static");
        setLoadError("Showing popular activity types for this destination.");
      }
    } finally {
      setLoading(false);
    }
  }, [destination]);

  /* On mount / destination change:
     - No trip → show general showcase (no API call)
     - Trip booked + city in local data → show static data (no API call)
     - Trip booked + city NOT in local data → fall back to AI */
  useEffect(() => {
    setActiveCategory("all");
    if (!trip.to) {
      setActivities(GENERAL_SHOWCASE);
      setDataSource("general");
      setLoading(false);
      return;
    }
    const cityKey  = trip.to.trim().toLowerCase();
    const cityData = CITY_ACTIVITIES[cityKey];
    if (cityData && cityData.length > 0) {
      setActivities(cityData);
      setDataSource("static");
      setLoading(false);
    } else {
      fetchActivities("all");
    }
  }, [trip.to]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    /* For static/general data, filter client-side — no API call needed */
    if (dataSource === "static" || dataSource === "general") return;
    fetchActivities(cat);
  };

  /* Filter client-side for static and general data */
  const filtered = (activeCategory === "all" || (dataSource !== "static" && dataSource !== "general"))
    ? activities
    : activities.filter((a) => a.category === activeCategory);

  /* Wishlist synced to TripContext */
  const toggleWishlist = (activity) => {
    const id = activity.id;
    setWishlistIds((p) => p.includes(id) ? p.filter((i) => i !== id) : [...p, id]);
    toggleActivity(activity);
  };

  const selectedIds    = wishlistIds;
  const totalCost      = activities.filter((a) => wishlistIds.includes(a.id)).reduce((s, a) => s + (a.price ?? 0), 0);
  const totalEmissions = activities.filter((a) => wishlistIds.includes(a.id)).reduce((s, a) => s + (a.emissions ?? 0), 0);

  /* Compat shim for ActivityCard (needs toggleSelect + toggleWishlist) */
  const toggleSelect = toggleWishlist;

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6" }}>

      {/* ══════════════════════════════════════
          DARK GREEN HEADER
         ══════════════════════════════════════ */}
      <div style={{
        paddingTop: "68px",
        background: "linear-gradient(135deg, #1a3a2a 0%, #2d7a4f 100%)",
      }}>
        <div style={{
          maxWidth: "72rem",
          margin: "0 auto",
          padding: "2rem 2rem 2.5rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "1.25rem",
        }}>
          {/* Left */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
              <MapPin style={{ width: "0.875rem", height: "0.875rem", color: "rgba(255,255,255,0.65)" }} />
              <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.65)", fontFamily: "'Inter',sans-serif" }}>
                {hasTrip
                  ? <>
                      {destination}
                      {trip.departure ? ` · ${new Date(trip.departure).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                      {trip.travelers ? ` · ${trip.travelers} Traveller${trip.travelers > 1 ? "s" : ""}` : ""}
                    </>
                  : "Worldwide · Discovery Mode"}
              </span>
            </div>
            <h1 style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: "clamp(1.75rem,3.5vw,2.5rem)",
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.15,
              marginBottom: "0.375rem",
            }}>
              {hasTrip ? "Activities & Experiences" : "Explore Activities Worldwide"}
            </h1>
            <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.72)", fontFamily: "'Inter',sans-serif" }}>
              {hasTrip
                ? `Curated eco-friendly experiences in ${destination}`
                : "Browse global eco-spots · Book a trip to start building your itinerary"}
            </p>
          </div>

          {/* Right — selection summary (shows when items selected) */}
          {selectedIds.length > 0 && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "1.25rem",
              padding: "1rem 1.5rem",
              borderRadius: "1rem",
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.18)",
            }}>
              {[
                { val: `£${totalCost}`,                   label: "Activities Cost" },
                { val: `${totalEmissions.toFixed(1)}`,    label: "kg CO₂" },
                { val: `${selectedIds.length}`,           label: "Selected" },
              ].map((item, i, arr) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", lineHeight: 1, fontFamily: "'Inter',sans-serif" }}>
                      {item.val}
                    </p>
                    <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.7)", fontFamily: "'Inter',sans-serif", marginTop: "0.2rem" }}>
                      {item.label}
                    </p>
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ width: "1px", height: "2rem", background: "rgba(255,255,255,0.28)" }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════
          CONTENT AREA
         ══════════════════════════════════════ */}
      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "2rem 2rem 4rem" }}>

        {/* ── Category Filter Pills ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginBottom: "1.75rem",
        }}>
          {CATEGORIES.map(({ id, label, emoji }) => {
            const active = activeCategory === id;
            return (
              <button
                key={id}
                onClick={() => handleCategoryChange(id)}
                style={{
                  padding: "0.6rem 1.125rem",
                  borderRadius: "0.875rem",
                  border: "none",
                  background: active ? "#2d7a4f" : "#fff",
                  color: active ? "#fff" : "#4b5563",
                  fontSize: "0.875rem",
                  fontWeight: active ? 600 : 500,
                  cursor: "pointer",
                  fontFamily: "'Inter',sans-serif",
                  boxShadow: active
                    ? "0 4px 14px rgba(45,122,79,0.28)"
                    : "0 2px 8px rgba(0,0,0,0.06)",
                  transition: "background 0.15s, color 0.15s, box-shadow 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {emoji} {label}
              </button>
            );
          })}
        </div>

        {/* ── Discovery mode banner (no trip booked) ── */}
        {!hasTrip && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: "1rem",
            padding: "1.125rem 1.5rem", borderRadius: "1rem",
            background: "linear-gradient(135deg,#fffbeb,#fef3c7)",
            border: "1px solid #fde68a", marginBottom: "1.25rem",
          }}>
            <span style={{ fontSize: "1.5rem", flexShrink: 0, lineHeight: 1 }}>🌍</span>
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#92400e", fontFamily: "'Inter',sans-serif", margin: "0 0 0.25rem" }}>
                You're in Discovery Mode
              </p>
              <p style={{ fontSize: "0.82rem", color: "#78350f", fontFamily: "'Inter',sans-serif", lineHeight: 1.6, margin: "0 0 0.625rem" }}>
                Browsing global eco-activities from cities worldwide. <strong>Book a trip</strong> on the Home page to unlock your destination's spots and add them to your personal itinerary.
              </p>
              <button
                onClick={() => navigate("/")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.5rem 1.125rem", borderRadius: "0.625rem",
                  border: "none", background: "#d97706", color: "#fff",
                  fontSize: "0.8rem", fontWeight: 700, cursor: "pointer",
                  fontFamily: "'Inter',sans-serif",
                }}
              >
                <ArrowRight style={{ width: "0.875rem", height: "0.875rem" }} />
                Plan a Trip Now
              </button>
            </div>
          </div>
        )}

        {/* ── Eco Notice Banner ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.875rem",
          padding: "1rem 1.25rem",
          borderRadius: "1rem",
          background: "#e8f5ee",
          border: "1px solid #bbf7d0",
          marginBottom: "1.75rem",
        }}>
          <Leaf style={{ width: "1.25rem", height: "1.25rem", color: "#2d7a4f", flexShrink: 0 }} />
          <p style={{ fontSize: "0.875rem", color: "#166534", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 }}>
            <strong>All activities on WayPoint</strong> are vetted for sustainability. Look for the
            eco-certified badge for activities with the lowest environmental impact.
          </p>
        </div>

        {/* ── Data source badge + load error ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.875rem", borderRadius: "9999px", background: "#e8f5ee", border: "1px solid #bbf7d0" }}>
              <Loader2 style={{ width: "0.875rem", height: "0.875rem", color: "#2d7a4f", animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: "0.78rem", color: "#166534", fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>Finding activities in {destination || "all cities"}…</span>
            </div>
          )}
          {!loading && dataSource === "general" && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.75rem", borderRadius: "9999px", background: "#fffbeb", border: "1px solid #fde68a" }}>
              <span style={{ fontSize: "0.75rem" }}>🌍</span>
              <span style={{ fontSize: "0.72rem", color: "#92400e", fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>Global showcase · Discovery Mode</span>
            </div>
          )}
          {!loading && dataSource === "places" && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.75rem", borderRadius: "9999px", background: "#e8f5ee", border: "1px solid #bbf7d0" }}>
              <Sparkles style={{ width: "0.75rem", height: "0.75rem", color: "#2d7a4f" }} />
              <span style={{ fontSize: "0.72rem", color: "#166534", fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>Live data · Google Places</span>
            </div>
          )}
          {!loading && dataSource === "ai" && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.75rem", borderRadius: "9999px", background: "#eff6ff", border: "1px solid #bfdbfe" }}>
              <Sparkles style={{ width: "0.75rem", height: "0.75rem", color: "#2563eb" }} />
              <span style={{ fontSize: "0.72rem", color: "#1d4ed8", fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>AI-generated · GPT-4o mini</span>
            </div>
          )}
          {!loading && loadError && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.75rem", borderRadius: "9999px", background: "#fff7ed", border: "1px solid #fed7aa" }}>
              <AlertCircle style={{ width: "0.75rem", height: "0.75rem", color: "#d97706" }} />
              <span style={{ fontSize: "0.72rem", color: "#92400e", fontFamily: "'Inter',sans-serif" }}>{loadError}</span>
              <button onClick={() => fetchActivities(activeCategory)} style={{ border: "none", background: "none", cursor: "pointer", padding: 0 }}>
                <RefreshCw style={{ width: "0.75rem", height: "0.75rem", color: "#d97706" }} />
              </button>
            </div>
          )}
          <span style={{ marginLeft: "auto", fontSize: "0.8rem", color: "#6b7280", fontFamily: "'Inter',sans-serif" }}>
            {filtered.length} experience{filtered.length !== 1 ? "s" : ""} found
          </span>
        </div>

        {/* ── Activities Grid ── */}
        <div className="activities-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1.5rem",
          marginBottom: "2.5rem",
        }}>
          {loading
            ? [1,2,3,4,5,6].map(i => (
                <div key={i} style={{ borderRadius: "1.25rem", background: "#fff", height: "22rem", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                  <div style={{ height: "11rem", background: "linear-gradient(90deg,#f0f0f0 25%,#e0e8e0 50%,#f0f0f0 75%)", backgroundSize: "400px 100%", animation: "shimmer 1.4s infinite" }} />
                  <div style={{ padding: "1rem" }}>
                    {[1,2,3].map(j => <div key={j} style={{ height: "0.75rem", borderRadius: "0.5rem", marginBottom: "0.5rem", background: "linear-gradient(90deg,#f0f0f0 25%,#e0e8e0 50%,#f0f0f0 75%)", backgroundSize: "400px 100%", animation: "shimmer 1.4s infinite" }} />)}
                  </div>
                </div>
              ))
            : filtered.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              isSelected={selectedIds.includes(activity.id)}
              isWishlisted={wishlistIds.includes(activity.id)}
              onSelect={(id) => toggleSelect(activity)}
              onWishlist={(id) => toggleWishlist(activity)}
              canSelect={hasTrip}
            />
          ))}
        </div>

        {/* ── CTA ── */}
        <div style={{ textAlign: "center" }}>
          {hasTrip ? (
            <button
              onClick={() => navigate("/my-trip")}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.625rem",
                padding: "1rem 2.5rem", borderRadius: "9999px",
                border: "none", background: "#2d7a4f", color: "#fff",
                fontSize: "1rem", fontWeight: 700, cursor: "pointer",
                fontFamily: "'Inter',sans-serif",
                boxShadow: "0 8px 25px rgba(45,122,79,0.32)",
                transition: "transform 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {selectedIds.length > 0
                ? <><CheckCircle2 style={{ width: "1.25rem", height: "1.25rem" }} /> View Trip Summary ({selectedIds.length} activities) <ArrowRight style={{ width: "1.25rem", height: "1.25rem" }} /></>
                : <>Continue to My Trip <ArrowRight style={{ width: "1.25rem", height: "1.25rem" }} /></>
              }
            </button>
          ) : (
            <button
              onClick={() => navigate("/")}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.625rem",
                padding: "1rem 2.5rem", borderRadius: "9999px",
                border: "none", background: "#d97706", color: "#fff",
                fontSize: "1rem", fontWeight: 700, cursor: "pointer",
                fontFamily: "'Inter',sans-serif",
                boxShadow: "0 8px 25px rgba(217,119,6,0.32)",
                transition: "transform 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <ArrowRight style={{ width: "1.25rem", height: "1.25rem" }} />
              Plan a Trip to Unlock Activities
            </button>
          )}
        </div>
        {/* Responsive: 2-col on medium, 1-col on small */}
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
          @media (max-width: 900px) {
            .activities-grid { grid-template-columns: repeat(2,1fr) !important; }
          }
          @media (max-width: 580px) {
            .activities-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </div>
  );
}
