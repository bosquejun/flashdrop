import type { Product } from "@repo/schema";

export const MOCK_PRODUCTS: Product[] = [
  {
    _id: "p2",
    sku: "AERO-BUDS-X",
    name: "AeroPods Max Wireless",
    description: "Spatial audio like you've never heard before. Pure immersion.",
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800",

    price: 2490,
    totalStock: 50,
    availableStock: 50,
    startDate: new Date(),
    endDate: new Date(),
    limit: { perUser: 1 },
    currency: "USD",
    createdAt: new Date(),
  },
  {
    _id: "p3",
    sku: "VISION-WATCH-SE",
    name: "Vision Watch Series 9",
    description: "Your health, on your wrist. Advanced sensors and sapphire crystal.",
    imageUrl:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800",
    price: 3990,
    totalStock: 12,
    availableStock: 12,
    startDate: new Date(),
    endDate: new Date(),
    limit: { perUser: 1 },
    currency: "USD",
    createdAt: new Date(),
  },
  {
    _id: "p4",
    sku: "LAPTOP-X-PRO",
    name: "Nebula Laptop X Pro",
    description: "Power through the most demanding tasks with the M4 Ultra equivalent chip.",
    imageUrl:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=800",
    price: 249900,
    totalStock: 12,
    availableStock: 12,
    startDate: new Date(),
    endDate: new Date(),
    limit: { perUser: 1 },
    currency: "USD",
    createdAt: new Date(),
  },
];
