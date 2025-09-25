export interface Restaurant {
    id: number;
    slug: string;
    name: string;
    cuisine: string;
    rating: number;        // 0~5
    priceLevel: '$' | '$$' | '$$$' | '$$$$';
    image: string;         // 백엔드 이미지 URL 연결 예정
    description: string;
    hours: string;
    location: string;
    phone: string;
  }
  
  export const restaurants: Restaurant[] = [
    {
      id: 1,
      slug: 'bella-vista',
      name: "Bella Vista",
      cuisine: "Italian",
      rating: 4.5,
      priceLevel: "$$$",
      image: "",
      description: "Authentic Italian cuisine with fresh ingredients and traditional recipes passed down through generations.",
      hours: "Mon-Sun: 5:00 PM - 10:00 PM",
      location: "123 Main Street, Downtown",
      phone: "(555) 123-4567"
    },
    {
      id: 2,
      slug: 'sakura-sushi',
      name: "Sakura Sushi",
      cuisine: "Japanese",
      rating: 4.8,
      priceLevel: "$$$$",
      image: "",
      description: "Authentic Japanese cuisine with the freshest ingredients, offering traditional sushi and modern fusion dishes.",
      hours: "Tue-Sun: 6:00 PM - 11:00 PM",
      location: "456 Ocean Ave, Waterfront",
      phone: "(555) 987-6543"
    },
    {
      id: 3,
      slug: 'casa-miguel',
      name: "Casa Miguel",
      cuisine: "Mexican",
      rating: 4.2,
      priceLevel: "$$",
      image: "",
      description: "Vibrant Mexican flavors in a colorful atmosphere, serving traditional tacos, enchiladas, and signature margaritas.",
      hours: "Daily: 11:00 AM - 10:00 PM",
      location: "789 Fiesta Boulevard, Arts District",
      phone: "(555) 246-8135"
    },
    {
      id: 4,
      slug: 'le-petit-bistro',
      name: "Le Petit Bistro",
      cuisine: "French",
      rating: 4.6,
      priceLevel: "$$$",
      image: "",
      description: "Elegant French dining experience with classic dishes prepared with modern techniques and finest ingredients.",
      hours: "Wed-Sun: 5:30 PM - 9:30 PM",
      location: "321 Vineyard Lane, Historic Quarter",
      phone: "(555) 369-2580"
    },
    {
      id: 5,
      slug: 'prime-cut-steakhouse',
      name: "Prime Cut Steakhouse",
      cuisine: "American",
      rating: 4.7,
      priceLevel: "$$$$",
      image: "",
      description: "Premium steakhouse featuring dry-aged beef, fresh seafood, and an extensive wine collection in an upscale setting.",
      hours: "Mon-Sat: 5:00 PM - 11:00 PM",
      location: "654 Executive Plaza, Business District",
      phone: "(555) 147-9630"
    },
    {
      id: 6,
      slug: 'bangkok-garden',
      name: "Bangkok Garden",
      cuisine: "Thai",
      rating: 4.3,
      priceLevel: "$$",
      image: "",
      description: "Authentic Thai cuisine with bold flavors and aromatic spices, offering both traditional and contemporary dishes.",
      hours: "Daily: 12:00 PM - 9:00 PM",
      location: "987 Spice Market Road, Little Thailand",
      phone: "(555) 852-7410"
    }
  ];