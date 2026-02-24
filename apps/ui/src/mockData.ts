// Mock data for secondary products (not connected to backend)
export interface MockProduct {
  id: string;
  sku: string;
  name: string;
  description: string;
  imageUrl: string;
  images?: string[];
  originalPrice: number;
  salePrice: number;
}

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: "p2",
    sku: "AERO-BUDS-X",
    name: "AeroPods Max Wireless",
    description: "Spatial audio like you've never heard before. Pure immersion.",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=800",
    ],
    originalPrice: 249,
    salePrice: 129,
  },
  {
    id: "p3",
    sku: "VISION-WATCH-SE",
    name: "Vision Watch Series 9",
    description: "Your health, on your wrist. Advanced sensors and sapphire crystal.",
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1544117518-30df578096a4?auto=format&fit=crop&q=80&w=800",
    ],
    originalPrice: 399,
    salePrice: 199,
  },
  {
    id: "p4",
    sku: "LAPTOP-X-PRO",
    name: "Nebula Laptop X Pro",
    description: "Power through the most demanding tasks with the M4 Ultra equivalent chip.",
    imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=800",
    originalPrice: 2499,
    salePrice: 1899,
  },
];
