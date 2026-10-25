// Sample data for step 1. Replaced by the database in step 2.
const AREAS = ["Town Centre", "Northside", "Riverside", "Hilltop"];

const FOODS = [
  { id: "chicken", label: "Chicken" },
  { id: "goat", label: "Goat" },
  { id: "pork", label: "Pork" },
  { id: "beef", label: "Beef" },
  { id: "fish", label: "Fish" },
  { id: "local", label: "Local dishes" }
];

const VENDORS = [
  { id: 1, name: "Mama Njeri Choma", area: "Town Centre", sells: ["goat", "beef"], note: "Goat half kilo 700. Beef half kilo 550.", delivers: true, phone: "0700 000 001", available: true, featured: true },
  { id: 2, name: "Kuku Corner", area: "Town Centre", sells: ["chicken"], note: "Whole roast chicken 1,200. Half 650.", delivers: true, phone: "0700 000 002", available: true, featured: false },
  { id: 3, name: "Baraka Pork Joint", area: "Town Centre", sells: ["pork"], note: "Pork half kilo 600. Fries 150.", delivers: false, phone: "0700 000 003", available: false, featured: false },
  { id: 4, name: "Riverside Samaki", area: "Riverside", sells: ["fish", "local"], note: "Tilapia from 450 with ugali.", delivers: true, phone: "0700 000 004", available: true, featured: false },
  { id: 5, name: "Auntie Wanjiru Kitchen", area: "Northside", sells: ["local", "chicken"], note: "Pilau 250. Chicken stew 350.", delivers: true, phone: "0700 000 005", available: true, featured: true },
  { id: 6, name: "Hilltop Nyama", area: "Hilltop", sells: ["goat", "beef", "pork"], note: "Mixed platter 1,500 feeds three.", delivers: false, phone: "0700 000 006", available: false, featured: false },
  { id: 7, name: "Otieno Grill", area: "Northside", sells: ["goat", "chicken"], note: "Goat ribs 800. Chicken quarter 350.", delivers: true, phone: "0700 000 007", available: false, featured: false }
];
