interface Category {
  id: string;
  name: string;
  count: number;
}

interface CategoryTabProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export default function CategoryTab({ 
  categories, 
  selectedCategory, 
  onCategoryChange 
}: CategoryTabProps) {
  return (
    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`
            whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm
            ${
              selectedCategory === category.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }
          `}
          aria-current={selectedCategory === category.id ? 'page' : undefined}
        >
          {category.name}
          <span
            className={`
              ml-2 py-0.5 px-2 rounded-full text-xs
              ${
                selectedCategory === category.id
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-900'
              }
            `}
          >
            {category.count}
          </span>
        </button>
      ))}
    </nav>
  );
}