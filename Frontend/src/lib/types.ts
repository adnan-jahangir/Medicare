export type Role = 'customer' | 'owner' | 'admin';

export type Category = 'Pain Relief' | 'Antibiotics' | 'Vitamins' | 'Cold & Flu' | 'Digestive' | 'Diabetes' | 'Heart' | 'Skin Care';

export interface Medicine {
  id: string;
  name: string;
  brand: string;
  strength: string; // "500mg"
  dosage: string;  // "1 tablet twice daily"
  description: string;
  category: Category;
  price: number;
  stock: number;
  image: string;
  prescriptionRequired: boolean;
  pharmacyId: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  city: string;
  rating: number;
  ownerName: string;
  monthlyRevenue: number;
}

export interface CartItem {
  medicineId: string;
  quantity: number;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Delivered';

export const ORDER_STAGES: OrderStatus[] = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Delivered'];

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  pharmacyId: string;
  items: { medicine: Medicine; quantity: number }[];
  total: number;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
  // Map: NYC-ish demo coords. [lng, lat]
  pickup: [number, number];
  destination: [number, number];
  // 0..1 progress along route
  driverProgress: number;
  prescriptionFile?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  //   erDiagram
  //     %% Entities
  //     USER {
  //         string id PK
  //         string name
  //         string email
  //         string role "Enum: customer, owner, admin"
  //         string shopCode
  //         string shopName
  //         string shopOwnerName
  //         string phoneNumber
  //         string shopLocation
  //     }
  
  //     PHARMACY {
  //         string id PK
  //         string name
  //         string city
  //         float rating
  //         string ownerName
  //         float monthlyRevenue
  //     }
  
  //     MEDICINE {
  //         string id PK
  //         string name
  //         string brand
  //         string strength
  //         string dosage
  //         string description
  //         string category "Enum: Pain Relief, Antibiotics, etc."
  //         float price
  //         int stock
  //         string image
  //         boolean prescriptionRequired
  //         string pharmacyId FK
  //     }
  
  //     ORDER {
  //         string id PK
  //         string customerName
  //         string customerEmail
  //         string pharmacyId FK
  //         float total
  //         string status "Enum: Pending, Confirmed, Preparing, Ready, Delivered"
  //         int createdAt
  //         int updatedAt
  //         float[] pickup "[lng, lat]"
  //         float[] destination "[lng, lat]"
  //         float driverProgress
  //         string prescriptionFile
  //     }
  
  //     ORDER_ITEM {
  //         string orderId FK
  //         string medicineId FK
  //         int quantity
  //     }
  
  //     %% Relationships
  //     PHARMACY ||--o{ MEDICINE : "inventories"
  //     PHARMACY ||--o{ ORDER : "receives"
  //     ORDER ||--|{ ORDER_ITEM : "contains"
  //     MEDICINE ||--o{ ORDER_ITEM : "included_in"
  
  //     %% Implicit relation (if Users represent Owners and Customers)
  //     USER ||--o{ PHARMACY : "owns (if role=owner)"
  //     USER ||--o{ ORDER : "places (if role=customer)"
  // role: Role;
  // shopCode?: string;
  // shopName?: string;
  // shopOwnerName?: string;
  // phoneNumber?: string;
  // shopLocation?: string;
}
