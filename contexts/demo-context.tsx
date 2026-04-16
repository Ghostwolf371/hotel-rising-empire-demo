"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import {
  defaultCatalog,
  defaultCategories,
  HOURLY_RATE_SRD,
  initialOrders,
  initialRooms,
} from "@/lib/mock-data";
import {
  isLocale,
  type Category,
  type GuestRating,
  type Locale,
  type Order,
  type PanicAlert,
  type Product,
  type Room,
  type RoomStatus,
  type Theme,
} from "@/lib/types";

const STORAGE_KEY = "hre-demo-v2";

export interface CartLine {
  productId: string;
  qty: number;
}

export interface GuestSession {
  roomNumber: string;
  durationHours: number;
  sessionEndsAt: number;
  sessionStartedAt: number;
}

interface PersistedState {
  rooms: Room[];
  orders: Order[];
  panicAlerts: PanicAlert[];
  guestRatings: GuestRating[];
  guestSession: GuestSession | null;
  locale: Locale;
  theme: Theme;
  catalog: Product[];
  categories: Category[];
  hourlyRate: number;
}

export type Action =
  | { type: "HYDRATE"; payload: Partial<PersistedState> }
  | { type: "SET_LOCALE"; locale: Locale }
  | { type: "SET_THEME"; theme: Theme }
  | { type: "START_GUEST_SESSION"; roomNumber: string; durationHours: number }
  | { type: "EXTEND_GUEST_SESSION"; extraHours: number }
  | { type: "END_GUEST_SESSION" }
  | {
      type: "SUBMIT_GUEST_RATING";
      roomNumber: string;
      cleanliness: number;
      comfort: number;
      service: number;
    }
  | { type: "UPDATE_ROOM_STATUS"; roomId: string; status: RoomStatus }
  | { type: "START_ROOM_SESSION"; roomId: string; durationHours: number }
  | { type: "END_ROOM_SESSION"; roomId: string }
  | { type: "PANIC"; roomNumber: string }
  | { type: "CLEAR_PANICS" }
  | { type: "CLEAR_PANIC_ALERT"; id: string }
  | { type: "ADD_ORDER"; order: Order }
  | { type: "SET_ORDER_STATUS"; orderId: string; status: Order["status"] }
  | { type: "CART_SET"; lines: CartLine[] }
  | { type: "CART_ADD"; productId: string; qty?: number }
  // Pricing
  | { type: "SET_HOURLY_RATE"; rate: number }
  // Inventory / Catalog
  | { type: "ADD_PRODUCT"; product: Product }
  | { type: "UPDATE_PRODUCT"; product: Product }
  | { type: "DELETE_PRODUCT"; productId: string }
  | { type: "TOGGLE_PRODUCT_AVAILABILITY"; productId: string }
  // Categories
  | { type: "ADD_CATEGORY"; category: Category }
  | { type: "UPDATE_CATEGORY"; category: Category }
  | { type: "DELETE_CATEGORY"; categoryId: string }
  // Room management
  | { type: "ADD_ROOM"; room: Room }
  | { type: "DELETE_ROOM"; roomId: string };

interface DemoState extends PersistedState {
  cart: CartLine[];
}

function defaultState(): DemoState {
  return {
    rooms: initialRooms(),
    orders: initialOrders(),
    panicAlerts: [],
    guestRatings: [],
    guestSession: null,
    locale: "en",
    theme: "dark",
    catalog: defaultCatalog,
    categories: defaultCategories,
    hourlyRate: HOURLY_RATE_SRD,
    cart: [],
  };
}

function reducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case "HYDRATE":
      return {
        ...state,
        ...action.payload,
        guestRatings: Array.isArray(action.payload.guestRatings)
          ? action.payload.guestRatings
          : (state.guestRatings ?? []),
        cart: state.cart,
      };
    case "SET_LOCALE":
      return { ...state, locale: action.locale };
    case "SET_THEME":
      return { ...state, theme: action.theme };
    case "START_GUEST_SESSION": {
      const now = Date.now();
      const durationHours = Math.min(168, Math.max(1, Math.round(action.durationHours)));
      const ms = durationHours * 60 * 60 * 1000;
      const guestSession: GuestSession = {
        roomNumber: action.roomNumber,
        durationHours,
        sessionStartedAt: now,
        sessionEndsAt: now + ms,
      };
      const rooms = state.rooms.map((r) =>
        r.number === action.roomNumber
          ? {
              ...r,
              status: "occupied" as const,
              sessionStartedAt: now,
              sessionEndsAt: now + ms,
              durationHours,
            }
          : r
      );
      return { ...state, guestSession, rooms };
    }
    case "EXTEND_GUEST_SESSION": {
      if (!state.guestSession) return state;
      const extraMs = action.extraHours * 60 * 60 * 1000;
      const sessionEndsAt = state.guestSession.sessionEndsAt + extraMs;
      const guestSession = { ...state.guestSession, sessionEndsAt };
      const rooms = state.rooms.map((r) =>
        r.number === state.guestSession!.roomNumber
          ? { ...r, sessionEndsAt }
          : r
      );
      return { ...state, guestSession, rooms };
    }
    case "END_GUEST_SESSION": {
      if (!state.guestSession) return { ...state, cart: [] };
      const roomNumber = state.guestSession.roomNumber;
      const rooms = state.rooms.map((r) =>
        r.number === roomNumber
          ? {
              ...r,
              status: "cleaning" as const,
              sessionEndsAt: undefined,
              sessionStartedAt: undefined,
              durationHours: undefined,
            }
          : r
      );
      return { ...state, guestSession: null, rooms, cart: [] };
    }
    case "SUBMIT_GUEST_RATING": {
      const rating: GuestRating = {
        id: `rate-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        roomNumber: action.roomNumber,
        submittedAt: Date.now(),
        cleanliness: action.cleanliness,
        comfort: action.comfort,
        service: action.service,
      };
      const next = [rating, ...state.guestRatings];
      return { ...state, guestRatings: next.slice(0, 500) };
    }
    case "UPDATE_ROOM_STATUS":
      return {
        ...state,
        rooms: state.rooms.map((r) =>
          r.id === action.roomId ? { ...r, status: action.status } : r
        ),
      };
    case "START_ROOM_SESSION": {
      const now = Date.now();
      const ms = action.durationHours * 60 * 60 * 1000;
      return {
        ...state,
        rooms: state.rooms.map((r) =>
          r.id === action.roomId
            ? {
                ...r,
                status: "occupied",
                sessionStartedAt: now,
                sessionEndsAt: now + ms,
                durationHours: action.durationHours,
              }
            : r
        ),
      };
    }
    case "END_ROOM_SESSION":
      return {
        ...state,
        rooms: state.rooms.map((r) =>
          r.id === action.roomId
            ? {
                ...r,
                status: "available",
                sessionEndsAt: undefined,
                sessionStartedAt: undefined,
                durationHours: undefined,
              }
            : r
        ),
      };
    case "PANIC": {
      const alert: PanicAlert = {
        id: `panic-${Date.now()}`,
        roomNumber: action.roomNumber,
        at: Date.now(),
      };
      return { ...state, panicAlerts: [alert, ...state.panicAlerts] };
    }
    case "CLEAR_PANICS":
      return { ...state, panicAlerts: [] };
    case "CLEAR_PANIC_ALERT":
      return {
        ...state,
        panicAlerts: state.panicAlerts.filter((a) => a.id !== action.id),
      };
    case "ADD_ORDER":
      return { ...state, orders: [action.order, ...state.orders] };
    case "SET_ORDER_STATUS":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId ? { ...o, status: action.status } : o
        ),
      };
    case "CART_SET":
      return { ...state, cart: action.lines };
    case "CART_ADD": {
      const q = action.qty ?? 1;
      const map = new Map(state.cart.map((l) => [l.productId, l.qty]));
      map.set(action.productId, (map.get(action.productId) ?? 0) + q);
      const lines: CartLine[] = [...map.entries()].map(([productId, qty]) => ({
        productId,
        qty,
      }));
      return { ...state, cart: lines };
    }
    // Pricing
    case "SET_HOURLY_RATE":
      return { ...state, hourlyRate: action.rate };
    // Inventory
    case "ADD_PRODUCT":
      return { ...state, catalog: [...state.catalog, action.product] };
    case "UPDATE_PRODUCT":
      return {
        ...state,
        catalog: state.catalog.map((p) =>
          p.id === action.product.id ? action.product : p
        ),
      };
    case "DELETE_PRODUCT":
      return {
        ...state,
        catalog: state.catalog.filter((p) => p.id !== action.productId),
      };
    case "TOGGLE_PRODUCT_AVAILABILITY":
      return {
        ...state,
        catalog: state.catalog.map((p) =>
          p.id === action.productId ? { ...p, available: !p.available } : p
        ),
      };
    // Categories
    case "ADD_CATEGORY":
      return { ...state, categories: [...state.categories, action.category] };
    case "UPDATE_CATEGORY":
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.category.id ? action.category : c
        ),
      };
    case "DELETE_CATEGORY":
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.categoryId),
      };
    // Room management
    case "ADD_ROOM":
      return { ...state, rooms: [...state.rooms, action.room] };
    case "DELETE_ROOM":
      return {
        ...state,
        rooms: state.rooms.filter((r) => r.id !== action.roomId),
      };
    default:
      return state;
  }
}

/** When ending the guest session we clear `guestSession` before navigation to `/guest/rate` finishes; guest pages must skip their “no session → duration” redirect once. */
type GuestPostSessionEndNavRef = MutableRefObject<{ skipDurationRedirectOnce: boolean }>;

interface DemoContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  rooms: Room[];
  orders: Order[];
  panicAlerts: PanicAlert[];
  guestRatings: GuestRating[];
  guestSession: GuestSession | null;
  catalog: Product[];
  categories: Category[];
  cart: CartLine[];
  hourlyRate: number;
  dispatch: React.Dispatch<Action>;
  productById: (id: string) => Product | undefined;
  addToCart: (productId: string, qty?: number) => void;
  setCartQty: (productId: string, qty: number) => void;
  removeCartLine: (productId: string) => void;
  clearCart: () => void;
  guestPostSessionEndNavRef: GuestPostSessionEndNavRef;
  armGuestNavToRatingAfterSessionEnd: () => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, defaultState);
  const guestPostSessionEndNavRef = useRef({ skipDurationRedirectOnce: false });
  const armGuestNavToRatingAfterSessionEnd = useCallback(() => {
    guestPostSessionEndNavRef.current.skipDurationRedirectOnce = true;
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (parsed.catalog) {
        parsed.catalog = parsed.catalog.map((raw) => {
          const p = raw as Product & { nameNl?: string };
          const name =
            typeof p.name === "string" && p.name.trim()
              ? p.name.trim()
              : String(p.nameNl ?? "").trim() || p.id;
          return {
            id: p.id,
            name,
            priceSrd: p.priceSrd,
            category: p.category,
            image: typeof p.image === "string" ? p.image : "",
            available: p.available ?? true,
          };
        });
      }
      if (parsed.categories?.length) {
        parsed.categories = parsed.categories.map((raw) => {
          const c = raw as Category & { nameNl?: string };
          const name =
            typeof c.name === "string" && c.name.trim()
              ? c.name.trim()
              : String(c.nameNl ?? "").trim() || c.id;
          return {
            id: c.id,
            name,
            color: typeof c.color === "string" && c.color ? c.color : "purple",
          };
        });
      }
      if (!parsed.categories || parsed.categories.length === 0) {
        parsed.categories = defaultCategories;
      }
      if (parsed.locale !== undefined && !isLocale(parsed.locale)) {
        parsed.locale = "en";
      }
      dispatch({ type: "HYDRATE", payload: parsed });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const toSave: PersistedState = {
      rooms: state.rooms,
      orders: state.orders,
      panicAlerts: state.panicAlerts,
      guestRatings: state.guestRatings,
      guestSession: state.guestSession,
      locale: state.locale,
      theme: state.theme,
      catalog: state.catalog,
      categories: state.categories,
      hourlyRate: state.hourlyRate,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      /* ignore */
    }
  }, [
    state.rooms,
    state.orders,
    state.panicAlerts,
    state.guestRatings,
    state.guestSession,
    state.locale,
    state.theme,
    state.catalog,
    state.categories,
    state.hourlyRate,
  ]);

  const productById = useCallback(
    (id: string) => state.catalog.find((p) => p.id === id),
    [state.catalog]
  );

  const addToCart = useCallback((productId: string, qty = 1) => {
    dispatch({ type: "CART_ADD", productId, qty });
  }, []);

  const setCartQty = useCallback(
    (productId: string, qty: number) => {
      const lines = state.cart
        .map((l) =>
          l.productId === productId ? { ...l, qty: Math.max(0, qty) } : l
        )
        .filter((l) => l.qty > 0);
      dispatch({ type: "CART_SET", lines });
    },
    [state.cart]
  );

  const removeCartLine = useCallback(
    (productId: string) => {
      dispatch({
        type: "CART_SET",
        lines: state.cart.filter((l) => l.productId !== productId),
      });
    },
    [state.cart]
  );

  const clearCart = useCallback(() => {
    dispatch({ type: "CART_SET", lines: [] });
  }, []);

  const setLocale = useCallback((locale: Locale) => {
    dispatch({ type: "SET_LOCALE", locale });
  }, []);

  const setTheme = useCallback((theme: Theme) => {
    dispatch({ type: "SET_THEME", theme });
  }, []);

  const toggleTheme = useCallback(() => {
    dispatch({ type: "SET_THEME", theme: state.theme === "dark" ? "light" : "dark" });
  }, [state.theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", state.theme);
  }, [state.theme]);

  const value = useMemo<DemoContextValue>(
    () => ({
      locale: state.locale,
      setLocale,
      theme: state.theme,
      setTheme,
      toggleTheme,
      rooms: state.rooms,
      orders: state.orders,
      panicAlerts: state.panicAlerts,
      guestRatings: state.guestRatings,
      guestSession: state.guestSession,
      catalog: state.catalog,
      categories: state.categories,
      cart: state.cart,
      hourlyRate: state.hourlyRate,
      dispatch,
      productById,
      addToCart,
      setCartQty,
      removeCartLine,
      clearCart,
      guestPostSessionEndNavRef,
      armGuestNavToRatingAfterSessionEnd,
    }),
    [
      state.locale,
      state.theme,
      state.rooms,
      state.orders,
      state.panicAlerts,
      state.guestRatings,
      state.guestSession,
      state.catalog,
      state.categories,
      state.cart,
      state.hourlyRate,
      setLocale,
      setTheme,
      toggleTheme,
      productById,
      addToCart,
      setCartQty,
      removeCartLine,
      clearCart,
      armGuestNavToRatingAfterSessionEnd,
    ]
  );

  return (
    <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used within DemoProvider");
  return ctx;
}
