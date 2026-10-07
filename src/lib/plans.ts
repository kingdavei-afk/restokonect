// Plans, limites et période d'essai RestoKonect
export const WHATSAPP_SUPPORT = "2250748323191";

export const TRIAL_DAYS = 14;

export type PlanId = "TRIAL" | "STARTER" | "PRO" | "BUSINESS";

export type PlanLimits = {
  label: string;
  users: number;
  products: number;
};

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  TRIAL: { label: "Essai", users: 1, products: 10 },
  STARTER: { label: "Starter", users: 3, products: 20 },
  PRO: { label: "Pro", users: 7, products: 60 },
  BUSINESS: { label: "Business", users: 15, products: 200 },
};

export type RestaurantPlan = {
  plan: string;
  trialEndsAt: Date | null;
  createdAt: Date;
};

export type PlanInfo = {
  plan: PlanId;
  limits: PlanLimits;
  onTrial: boolean;
  trialExpired: boolean;
  daysLeft: number;
};

export function getPlanInfo(restaurant: RestaurantPlan): PlanInfo {
  const plan = (restaurant.plan as PlanId) in PLAN_LIMITS
    ? (restaurant.plan as PlanId)
    : "TRIAL";
  const limits = PLAN_LIMITS[plan];

  // Essai : 14 jours à partir de la fin définie, ou à défaut depuis l'inscription
  const trialEnd =
    restaurant.trialEndsAt ??
    new Date(restaurant.createdAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();
  const onTrial = plan === "TRIAL" && trialEnd > now;
  const msLeft = trialEnd.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));

  return {
    plan,
    limits,
    onTrial,
    trialExpired: plan === "TRIAL" && !onTrial,
    daysLeft,
  };
}

export function isPlanId(value: string): value is PlanId {
  return value in PLAN_LIMITS;
}

export function whatsappSubscribeUrl(restaurantName?: string) {
  const message =
    "Bonjour RestoKonect ! Je souhaite m'abonner pour mon restaurant" +
    (restaurantName ? ` « ${restaurantName} »` : "") +
    ". Quel plan me conseillez-vous ?";
  return `https://wa.me/${WHATSAPP_SUPPORT}?text=${encodeURIComponent(message)}`;
}

export function whatsappSubscribeUrlForPlan(planName: string, price: string) {
  const message = `Bonjour RestoKonect ! Je souhaite souscrire au plan ${planName} (${price}/mois) pour mon restaurant.`;
  return `https://wa.me/${WHATSAPP_SUPPORT}?text=${encodeURIComponent(message)}`;
}