export type RoleType =
  | "IMPORTER"
  | "LOCAL_MERCHANT"
  | "INDIVIDUAL"
  | "SUPPLIER"
  | "ADMIN";

export type ProductCategory =
  | "ELECTRONICS"
  | "TEXTILE_FASHION"
  | "FOOD_BEVERAGE"
  | "COSMETICS_BEAUTY"
  | "HOME_FURNITURE"
  | "CONSTRUCTION"
  | "VEHICLES_PARTS"
  | "AGRICULTURE"
  | "HEALTH_PHARMACY"
  | "TOYS_GAMES"
  | "SPORTS"
  | "STATIONERY"
  | "SECOND_HAND"
  | "OTHER";

export type ShippingType = "LCL" | "FCL20" | "FCL40" | "AIR";

export type ItemCondition =
  | "NEW_WITH_TAGS"
  | "LIKE_NEW"
  | "GOOD"
  | "ACCEPTABLE"
  | "WORN";

export type ShipmentStatus =
  | "BOOKING"
  | "LOADING"
  | "IN_TRANSIT"
  | "CUSTOMS"
  | "DELIVERED"
  | "COMPLETED";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "SHIPPED"
  | "IN_CUSTOMS"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";

export type OrderType = "CHINA_IMPORT" | "LOCAL_WHOLESALE" | "SECOND_HAND";

export type PaymentMethod =
  | "ORANGE_MONEY"
  | "MTN_MOMO"
  | "STRIPE_USD"
  | "WALLET"
  | "CASH_ON_DELIVERY";

export type PaymentStatus =
  | "PENDING"
  | "IN_ESCROW"
  | "RELEASED"
  | "REFUNDED"
  | "FAILED";

export type TransactionType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "ESCROW_LOCK"
  | "ESCROW_RELEASE"
  | "REFUND"
  | "COMMISSION";

export type NotificationType =
  | "ORDER_CONFIRMED"
  | "ORDER_SHIPPED"
  | "ORDER_DELIVERED"
  | "PAYMENT_RECEIVED"
  | "PAYMENT_RELEASED"
  | "MESSAGE_RECEIVED"
  | "SHIPMENT_UPDATE"
  | "PRODUCT_APPROVED"
  | "REVIEW_RECEIVED"
  | "SYSTEM";

export interface GuineaRegion {
  name: string;
  code: string;
  prefectures: string[];
}

export interface SessionUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  roles: string[];
  isVerified: boolean;
}

declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }
  interface User {
    id: string;
    phone: string;
    roles: string[];
    isVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    phone: string;
    roles: string[];
    isVerified: boolean;
  }
}
