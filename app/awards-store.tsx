"use client";

import { useState } from "react";
import { Check, ExternalLink, ShoppingBag, X } from "lucide-react";

export type StoreProduct = {
  id: string; name: string; description: string; price_cents: number;
  image_url: string; source_url: string; options: Record<string, string[]>;
  option_price_adjustments: Record<string, Record<string, number>>;
  personalization_fields: { label: string; price_cents: number; max_length: number }[];
};
export type StoreOrder = {
  id: string; staff_id?: string; product_id?: string; product_name: string;
  selected_options: Record<string, string>; price_cents: number;
  points_spent: number; status: "pending" | "fulfilled" | "cancelled"; created_at: string;
};
export type StoreData = {
  products: StoreProduct[]; orders: StoreOrder[]; adminOrders: StoreOrder[];
  spentPoints: number; spendablePoints: number;
};

const dollars = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
const pointCost = (priceCents: number) => Math.ceil(priceCents / 10);
const optionText = (options: Record<string, string>) => Object.entries(options).map(([key, value]) => `${key}: ${value}`).join(" · ");
const selectedPrice = (product: StoreProduct, choices: Record<string, string>) => product.price_cents
  + Object.entries(product.options).reduce((sum, [label]) => sum + (product.option_price_adjustments?.[label]?.[choices[label]] || 0), 0)
  + (product.personalization_fields || []).reduce((sum, field) => sum + (choices[field.label]?.trim() ? field.price_cents : 0), 0);

export default function AwardsStore({ store, earnedPoints, staff, isAdmin, busy, onRedeem, onUpdateOrder }: {
  store?: StoreData;
  earnedPoints: number;
  staff: { id: string; name: string; email: string }[];
  isAdmin: boolean;
  busy: boolean;
  onRedeem: (productId: string, options: Record<string, string>) => Promise<boolean>;
  onUpdateOrder: (orderId: string, status: "fulfilled" | "cancelled") => Promise<boolean>;
}) {
  const [selected, setSelected] = useState<StoreProduct | null>(null);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"shop" | "orders" | "admin">("shop");
  const products = store?.products || [];
  const orders = store?.orders || [];
  const adminOrders = store?.adminOrders || [];
  const spendable = store?.spendablePoints || 0;
  const staffById = new Map(staff.map((person) => [person.id, person]));
  const chosenPrice = selected ? selectedPrice(selected, choices) : 0;
  const openProduct = (product: StoreProduct) => { setSelected(product); setChoices({}); };
  const ordered = async () => {
    if (!selected) return;
    if (await onRedeem(selected.id, Object.fromEntries(Object.entries(choices).filter(([, value]) => value.trim())))) { setSelected(null); setChoices({}); setTab("orders"); }
  };
  return <div className="awards-store">
    <div className="page-heading"><div><div className="eyebrow">YOUR RECOGNITION, YOUR REWARD</div><h1>Awards Store <span className="heading-sparkle">✦</span></h1><p>Redeem the points you&apos;ve earned for Bright Harbor gear.</p></div></div>
    <div className="store-balance"><div className="store-balance-icon"><ShoppingBag size={26}/></div><div><span>AVAILABLE TO SPEND</span><strong>{spendable} points</strong><p>Worth {dollars(spendable * 10)} · 10 points = $1</p></div><div className="store-balance-detail"><span>Lifetime points earned</span><strong>{earnedPoints}</strong><small>Redemptions never reduce your dashboard total.</small></div></div>
    <div className="store-tabs" role="tablist" aria-label="Awards Store views"><button role="tab" aria-selected={tab === "shop"} className={tab === "shop" ? "active" : ""} onClick={() => setTab("shop")}>Shop items</button><button role="tab" aria-selected={tab === "orders"} className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>My orders</button>{isAdmin && <button role="tab" aria-selected={tab === "admin"} className={tab === "admin" ? "active" : ""} onClick={() => setTab("admin")}>Manage orders</button>}</div>
    {tab === "shop" && (products.length ? <div className="store-grid">{products.map((product) => <article className="store-product" key={product.id}><div className="store-image">{product.image_url ? <img src={product.image_url} alt={product.name} loading="lazy"/> : <ShoppingBag size={44}/>}</div><div className="store-product-body"><h2>{product.name}</h2>{product.description && <p>{product.description}</p>}<div className="store-price"><span>From {dollars(product.price_cents)}</span><strong>From {pointCost(product.price_cents)} points</strong></div><button className="button button-primary" disabled={spendable < pointCost(product.price_cents)} onClick={() => openProduct(product)}>{spendable < pointCost(product.price_cents) ? "More points needed" : "Choose options"}</button></div></article>)}</div> : <div className="store-empty"><ShoppingBag size={34}/><h2>Store items are coming soon.</h2><p>Your points are ready. Check back when the catalog is published.</p></div>)}
    {tab === "orders" && <div className="store-order-list">{orders.length ? orders.map((order) => <div className="store-order" key={order.id}><div><strong>{order.product_name}</strong><p>{optionText(order.selected_options) || "Standard item"}</p><small>Ordered {new Date(order.created_at).toLocaleDateString()}</small></div><div className="store-order-summary"><b>{order.points_spent} points</b><span className={`order-status ${order.status}`}>{order.status}</span></div></div>) : <div className="store-empty"><ShoppingBag size={34}/><h2>No orders yet.</h2><p>Choose an item to redeem your first reward.</p></div>}</div>}
    {tab === "admin" && isAdmin && <div className="store-order-list">{adminOrders.length ? adminOrders.map((order) => <div className="store-order" key={order.id}><div><strong>{order.product_name}</strong><p>{staffById.get(order.staff_id || "")?.name || "Staff member"} · {staffById.get(order.staff_id || "")?.email || ""}</p><p>{optionText(order.selected_options) || "Standard item"}</p><small>Ordered {new Date(order.created_at).toLocaleDateString()} · {order.points_spent} points</small></div><div className="store-order-summary"><span className={`order-status ${order.status}`}>{order.status}</span>{order.status === "pending" && <div className="order-actions"><button disabled={busy} onClick={() => onUpdateOrder(order.id, "fulfilled")}><Check size={14}/> Fulfilled</button><button disabled={busy} onClick={() => onUpdateOrder(order.id, "cancelled")}>Cancel</button></div>}</div></div>) : <div className="store-empty"><h2>No orders to manage.</h2></div>}</div>}
    {selected && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><div className="modal store-modal" role="dialog" aria-modal="true" aria-label={`Order ${selected.name}`}><button className="modal-close" onClick={() => setSelected(null)} aria-label="Close"><X size={20}/></button><div className="store-modal-head"><div className="store-modal-image">{selected.image_url ? <img src={selected.image_url} alt={selected.name}/> : <ShoppingBag size={40}/>}</div><div><div className="eyebrow">REDEEM YOUR POINTS</div><h2>{selected.name}</h2><p>{dollars(chosenPrice)} · {pointCost(chosenPrice)} points</p><small className="store-preview-caption">Image shows one available color.</small></div></div>{Object.entries(selected.options).map(([label, values]) => <label key={label}>{label}<select value={choices[label] || ""} onChange={(event) => setChoices((current) => ({ ...current, [label]: event.target.value }))}><option value="">Select {label.toLowerCase()}</option>{values.map((value) => { const extra = selected.option_price_adjustments?.[label]?.[value] || 0; return <option key={value} value={value}>{value}{extra ? ` (+${dollars(extra)})` : ""}</option>; })}</select></label>)}{(selected.personalization_fields || []).map((field) => <label key={field.label}>{field.label} <span className="store-optional">Optional · +{dollars(field.price_cents)}</span><input value={choices[field.label] || ""} maxLength={field.max_length} onChange={(event) => setChoices((current) => ({ ...current, [field.label]: event.target.value }))} placeholder={`Enter ${field.label.toLowerCase()}`} /></label>)}<div className="store-order-preview"><span>Your balance after this order</span><strong>{spendable - pointCost(chosenPrice)} points</strong></div><p className="store-order-note">Your order will be sent to the Bright Harbor team for fulfillment. It does not place an order with the shirt vendor.</p><button disabled={busy || spendable < pointCost(chosenPrice) || Object.keys(selected.options).some((label) => !choices[label])} className="button button-primary full submit-button" onClick={ordered}>{spendable < pointCost(chosenPrice) ? "More points needed" : busy ? "Placing order..." : `Order for ${pointCost(chosenPrice)} points`}</button>{selected.source_url && <a className="store-source" href={selected.source_url} target="_blank" rel="noopener noreferrer">View original item <ExternalLink size={14}/></a>}</div></div>}
  </div>;
}
