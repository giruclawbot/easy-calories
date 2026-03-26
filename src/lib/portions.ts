export interface PortionUnit {
  label: string
  labelEn: string
  labelEs: string
  grams: number
  icon?: string
}

export interface FoodCategory {
  keywords: string[]
  portions: PortionUnit[]
}

export const FOOD_CATEGORIES: FoodCategory[] = [
  {
    keywords: ['egg', 'huevo', 'yolk', 'yema', 'white', 'clara'],
    portions: [
      { label: '1 small egg', labelEn: '1 small egg', labelEs: '1 huevo pequeño', grams: 38, icon: '🥚' },
      { label: '1 medium egg', labelEn: '1 medium egg', labelEs: '1 huevo mediano', grams: 44, icon: '🥚' },
      { label: '1 large egg', labelEn: '1 large egg', labelEs: '1 huevo grande', grams: 50, icon: '🥚' },
      { label: '1 XL egg', labelEn: '1 XL egg', labelEs: '1 huevo XL', grams: 56, icon: '🥚' },
    ],
  },
  {
    keywords: ['bread', 'pan ', 'toast', 'baguette', 'tortilla', 'wrap', 'pita', 'bagel', 'muffin', 'croissant', 'bolillo'],
    portions: [
      { label: '1 slice', labelEn: '1 slice', labelEs: '1 rebanada', grams: 30, icon: '🍞' },
      { label: '1 tortilla', labelEn: '1 tortilla', labelEs: '1 tortilla', grams: 45, icon: '🫓' },
      { label: '1 bagel', labelEn: '1 bagel', labelEs: '1 bagel', grams: 105, icon: '🥯' },
      { label: '1 baguette slice', labelEn: '1 baguette slice', labelEs: '1 rodaja', grams: 25 },
    ],
  },
  {
    keywords: ['apple', 'manzana'],
    portions: [
      { label: '1 medium apple', labelEn: '1 medium apple', labelEs: '1 manzana mediana', grams: 182, icon: '🍎' },
    ],
  },
  {
    keywords: ['banana', 'plátano', 'platano'],
    portions: [
      { label: '1 banana', labelEn: '1 banana', labelEs: '1 plátano', grams: 118, icon: '🍌' },
    ],
  },
  {
    keywords: ['orange', 'naranja'],
    portions: [
      { label: '1 orange', labelEn: '1 orange', labelEs: '1 naranja', grams: 131, icon: '🍊' },
    ],
  },
  {
    keywords: ['strawberry', 'fresa'],
    portions: [
      { label: '1 strawberry', labelEn: '1 strawberry', labelEs: '1 fresa', grams: 12, icon: '🍓' },
      { label: '1 cup strawberries', labelEn: '1 cup strawberries', labelEs: '1 taza de fresas', grams: 152, icon: '🍓' },
    ],
  },
  {
    keywords: ['avocado', 'aguacate'],
    portions: [
      { label: '½ avocado', labelEn: '½ avocado', labelEs: '½ aguacate', grams: 75, icon: '🥑' },
      { label: '1 avocado', labelEn: '1 avocado', labelEs: '1 aguacate', grams: 150, icon: '🥑' },
    ],
  },
  {
    keywords: ['pear', 'pera', 'peach', 'durazno', 'mango', 'grape', 'uva', 'blueberry', 'arándano', 'watermelon', 'sandía', 'melon', 'melón', 'kiwi', 'pineapple', 'piña', 'cherry', 'cereza'],
    portions: [
      { label: '1 medium piece', labelEn: '1 medium piece', labelEs: '1 pieza mediana', grams: 150, icon: '🍑' },
      { label: '1 cup', labelEn: '1 cup', labelEs: '1 taza', grams: 150, icon: '🍑' },
    ],
  },
  {
    keywords: ['milk', 'leche', 'yogurt', 'yoghurt', 'cream', 'crema', 'kefir'],
    portions: [
      { label: '1 cup', labelEn: '1 cup', labelEs: '1 taza', grams: 244, icon: '🥛' },
      { label: '½ cup', labelEn: '½ cup', labelEs: '½ taza', grams: 122 },
      { label: '1 tbsp', labelEn: '1 tbsp', labelEs: '1 cucharada', grams: 15 },
    ],
  },
  {
    keywords: ['cheese', 'queso', 'cheddar', 'mozzarella', 'parmesan', 'parmesano', 'brie', 'camembert', 'gouda', 'panela', 'oaxaca', 'manchego', 'cottage', 'ricotta'],
    portions: [
      { label: '1 slice', labelEn: '1 slice', labelEs: '1 rebanada', grams: 28, icon: '🧀' },
      { label: '1 oz', labelEn: '1 oz', labelEs: '1 oz', grams: 28, icon: '🧀' },
      { label: '1 tbsp shredded', labelEn: '1 tbsp shredded', labelEs: '1 cda rallado', grams: 10 },
      { label: '¼ cup', labelEn: '¼ cup', labelEs: '¼ taza', grams: 28 },
    ],
  },
  {
    keywords: ['chicken', 'pollo', 'beef', 'carne', 'steak', 'bistec', 'pork', 'cerdo', 'turkey', 'pavo', 'lamb', 'cordero', 'fish', 'pescado', 'salmon', 'salmón', 'tuna', 'atún', 'shrimp', 'camarón', 'tilapia', 'cod', 'bacalao'],
    portions: [
      { label: '1 small fillet', labelEn: '1 small fillet', labelEs: '1 filete pequeño', grams: 85, icon: '🍗' },
      { label: '1 medium fillet', labelEn: '1 medium fillet', labelEs: '1 filete mediano', grams: 120 },
      { label: '1 large fillet', labelEn: '1 large fillet', labelEs: '1 filete grande', grams: 170 },
      { label: '1 oz', labelEn: '1 oz', labelEs: '1 oz', grams: 28 },
    ],
  },
  {
    keywords: ['rice', 'arroz', 'pasta', 'noodle', 'spaghetti', 'macaroni', 'fideo', 'quinoa', 'oat', 'avena', 'cereal', 'granola', 'couscous', 'cuscús'],
    portions: [
      { label: '½ cup cooked', labelEn: '½ cup cooked', labelEs: '½ taza cocida', grams: 90, icon: '🍚' },
      { label: '1 cup cooked', labelEn: '1 cup cooked', labelEs: '1 taza cocida', grams: 180, icon: '🍚' },
      { label: '¼ cup dry', labelEn: '¼ cup dry', labelEs: '¼ taza seca', grams: 45 },
    ],
  },
  {
    keywords: ['bean', 'frijol', 'lentil', 'lenteja', 'chickpea', 'garbanzo', 'pea', 'chícharo', 'edamame', 'soy', 'soja'],
    portions: [
      { label: '½ cup cooked', labelEn: '½ cup cooked', labelEs: '½ taza cocida', grams: 86 },
      { label: '1 cup cooked', labelEn: '1 cup cooked', labelEs: '1 taza cocida', grams: 172 },
    ],
  },
  {
    keywords: ['almond', 'almendra', 'walnut', 'nuez', 'peanut', 'cacahuate', 'cashew', 'anacardo', 'pistachio', 'pistacho', 'seed', 'semilla', 'chia', 'flax', 'linaza', 'sunflower', 'girasol', 'pumpkin', 'pepita', 'pecan', 'pacana', 'hazelnut', 'avellana'],
    portions: [
      { label: '1 oz (~23 almonds)', labelEn: '1 oz (~23 almonds)', labelEs: '1 oz (~23 almendras)', grams: 28 },
      { label: '1 handful', labelEn: '1 handful', labelEs: '1 puñado', grams: 30 },
      { label: '1 tbsp', labelEn: '1 tbsp', labelEs: '1 cucharada', grams: 9 },
    ],
  },
  {
    keywords: ['oil', 'aceite', 'olive', 'oliva', 'butter', 'mantequilla', 'margarine', 'margarina', 'lard', 'manteca', 'coconut', 'coco'],
    portions: [
      { label: '1 tbsp', labelEn: '1 tbsp', labelEs: '1 cucharada', grams: 14, icon: '🫒' },
      { label: '1 tsp', labelEn: '1 tsp', labelEs: '1 cucharadita', grams: 5 },
    ],
  },
  {
    keywords: ['juice', 'jugo', 'soda', 'refresco', 'cola', 'coffee', 'café', 'tea', 'té', 'water', 'agua', 'smoothie', 'shake', 'batido', 'sport', 'gatorade'],
    portions: [
      { label: '1 cup (240ml)', labelEn: '1 cup (240ml)', labelEs: '1 taza (240ml)', grams: 240, icon: '☕' },
      { label: '1 large glass', labelEn: '1 large glass', labelEs: '1 vaso grande', grams: 355 },
      { label: '1 can', labelEn: '1 can', labelEs: '1 lata', grams: 355 },
    ],
  },
  {
    keywords: ['broccoli', 'brócoli', 'carrot', 'zanahoria', 'spinach', 'espinaca', 'lettuce', 'lechuga', 'tomato', 'tomate', 'pepper', 'chile', 'onion', 'cebolla', 'potato', 'papa', 'sweet potato', 'camote', 'zucchini', 'calabaza', 'cucumber', 'pepino', 'celery', 'apio', 'corn', 'maíz', 'mushroom', 'hongo', 'champiñon'],
    portions: [
      { label: '1 cup raw', labelEn: '1 cup raw', labelEs: '1 taza cruda', grams: 85, icon: '🥦' },
      { label: '1 cup cooked', labelEn: '1 cup cooked', labelEs: '1 taza cocida', grams: 156 },
      { label: '1 medium piece', labelEn: '1 medium piece', labelEs: '1 pieza mediana', grams: 100 },
    ],
  },
]

export function getPortionsForFood(foodName: string): PortionUnit[] {
  const lower = foodName.toLowerCase()
  const seen = new Set<string>()
  const result: PortionUnit[] = []

  for (const category of FOOD_CATEGORIES) {
    const matched = category.keywords.some(kw => lower.includes(kw))
    if (matched) {
      for (const portion of category.portions) {
        const key = `${portion.labelEn}:${portion.grams}`
        if (!seen.has(key)) {
          seen.add(key)
          result.push(portion)
        }
      }
    }
  }

  return result
}
