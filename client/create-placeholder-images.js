import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Список категорий
const categories = [
  'motorcycles',
  'gear',
  'parts',
  'accessories',
  'sport-bikes',
  'cruisers',
  'enduro',
  'helmets',
  'jackets',
  'gloves',
  'engine-parts',
  'brake-system',
  'electrical',
  'luggage',
  'protection',
  'electronics'
];

// Список продуктов
const products = [
  'yamaha-r1',
  'harley-road-king',
  'bmw-gs',
  'agv-k6',
  'dainese-jacket',
  'alpinestars-gloves',
  'oil-filter',
  'brembo-pads',
  'yuasa-battery',
  'givi-case',
  'frame-sliders',
  'garmin-zumo'
];

// Создание заглушки для изображения
const createPlaceholderImage = (filePath) => {
  const svgContent = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f0f0f0"/>
    <text x="50%" y="50%" font-family="Arial" font-size="24" text-anchor="middle" fill="#333">
      ${path.basename(filePath, path.extname(filePath))}
    </text>
  </svg>`;
  
  fs.writeFileSync(filePath, svgContent);
  console.log(`Created placeholder image: ${filePath}`);
};

// Создание директорий, если они не существуют
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
};

// Создание заглушек для категорий
const categoriesDir = path.join(__dirname, 'public', 'images', 'categories');
ensureDir(categoriesDir);

categories.forEach(category => {
  const filePath = path.join(categoriesDir, `${category}.jpg`);
  createPlaceholderImage(filePath);
});

// Создание заглушек для продуктов
const productsDir = path.join(__dirname, 'public', 'images', 'products');
ensureDir(productsDir);

products.forEach(product => {
  const filePath = path.join(productsDir, `${product}.jpg`);
  createPlaceholderImage(filePath);
});

// Создание заглушки для hero-изображения
const heroImagePath = path.join(__dirname, 'public', 'images', 'hero-motorcycle.jpg');
createPlaceholderImage(heroImagePath);

console.log('All placeholder images created successfully!');
