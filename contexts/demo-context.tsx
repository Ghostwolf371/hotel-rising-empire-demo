"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
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
import * as hotelSync from "@/app/actions/hotel-data";

const STORAGE_KEY = "hre-demo-v2";

/** Normalizes catalog/categories/locale from localStorage before HYDRATE. */
export function normalizePersistedPayload(
  parsed: Partial<PersistedState>,
): Partial<PersistedState> {
  const out: Partial<PersistedState> = { ...parsed };
  if (out.catalog) {
    out.catalog = out.catalog.map((raw) => {
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
  if (out.categories?.length) {
    out.categories = out.categories.map((raw) => {
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
  if (!out.categories || out.categories.length === 0) {
    out.categories = defaultCategories;
  }
  if (out.locale !== undefined && !isLocale(out.locale)) {
    out.locale = "en";
  }
  return out;
}

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
  /** Used only for HYDRATE merges (e.g. database mode restoring cart from localStorage). */
  cart?: CartLine[];
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
      /** When set (e.g. database sync), used as the persisted rating id. */
      ratingId?: string;
    }
  | { type: "UPDATE_ROOM_STATUS"; roomId: string; status: RoomStatus }
  | { type: "START_ROOM_SESSION"; roomId: string; durationHours: number }
  | { type: "END_ROOM_SESSION"; roomId: string }
  | {
      type: "PANIC";
      roomNumber: string;
      /** When set (e.g. database sync), used as the persisted panic alert id. */
      alertId?: string;
      at?: number;
    }
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
          : state.guestRatings,
        cart:
          action.payload.cart !== undefined
            ? action.payload.cart
            : state.cart,
        guestSession:
          action.payload.guestSession !== undefined
            ? action.payload.guestSession
            : state.guestSession,
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
        id:
          action.ratingId ??
          `rate-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
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
        id: action.alertId ?? `panic-${Date.now()}`,
        roomNumber: action.roomNumber,
        at: action.at ?? Date.now(),
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

type DbSyncCtx = {
  guestSessionEndRoom?: string;
  guestExtendRoom?: string;
  guestExtendEndsAt?: number;
  toggleNextAvailable?: boolean;
};

function mergeDbHydrate(
  server: Awaited<ReturnType<typeof hotelSync.loadDomainSnapshot>>,
  local: {
    guestSession: GuestSession | null;
    cart: CartLine[];
    locale: Locale;
    theme: Theme;
  },
): Partial<PersistedState> {
  return {
    rooms: server.rooms,
    orders: server.orders,
    panicAlerts: server.panicAlerts,
    guestRatings: server.guestRatings,
    catalog: server.catalog,
    categories: server.categories,
    hourlyRate: server.hourlyRate,
    guestSession: local.guestSession,
    locale: local.locale,
    theme: local.theme,
    cart: local.cart,
  };
}

function isDbSyncedAction(action: Action): boolean {
  switch (action.type) {
    case "HYDRATE":
    case "SET_LOCALE":
    case "SET_THEME":
    case "CART_SET":
    case "CART_ADD":
      return false;
    default:
      return true;
  }
}

async function pushActionToDatabase(
  action: Action,
  ctx: DbSyncCtx,
): Promise<void> {
  switch (action.type) {
    case "SET_HOURLY_RATE":
      await hotelSync.syncSetHourlyRate(action.rate);
      return;
    case "SET_ORDER_STATUS":
      await hotelSync.syncSetOrderStatus(action.orderId, action.status);
      return;
    case "ADD_ORDER":
      await hotelSync.syncCreateOrder(action.order);
      return;
    case "UPDATE_ROOM_STATUS":
      await hotelSync.syncUpdateRoomStatus(action.roomId, action.status);
      return;
    case "START_ROOM_SESSION":
      await hotelSync.syncManagementRoomSessionStart(
        action.roomId,
        action.durationHours,
      );
      return;
    case "END_ROOM_SESSION":
      await hotelSync.syncManagementRoomSessionEnd(action.roomId);
      return;
    case "START_GUEST_SESSION":
      await hotelSync.syncGuestSessionStart(
        action.roomNumber,
        action.durationHours,
      );
      return;
    case "EXTEND_GUEST_SESSION": {
      const room = ctx.guestExtendRoom;
      const ends = ctx.guestExtendEndsAt;
      if (room && ends !== undefined) {
        await hotelSync.syncGuestSessionExtend(room, ends);
      }
      return;
    }
    case "END_GUEST_SESSION": {
      const room = ctx.guestSessionEndRoom;
      if (room) await hotelSync.syncGuestSessionEnd(room);
      return;
    }
    case "SUBMIT_GUEST_RATING":
      await hotelSync.syncSubmitGuestRating({
        id: action.ratingId!,
        roomNumber: action.roomNumber,
        submittedAt: Date.now(),
        cleanliness: action.cleanliness,
        comfort: action.comfort,
        service: action.service,
      });
      return;
    case "PANIC":
      await hotelSync.syncPanic({
        id: action.alertId!,
        roomNumber: action.roomNumber,
        at: action.at ?? Date.now(),
      });
      return;
    case "CLEAR_PANICS":
      await hotelSync.syncClearPanics();
      return;
    case "CLEAR_PANIC_ALERT":
      await hotelSync.syncClearPanicAlert(action.id);
      return;
    case "ADD_CATEGORY":
      await hotelSync.syncAddCategory(action.category);
      return;
    case "UPDATE_CATEGORY":
      await hotelSync.syncUpdateCategory(action.category);
      return;
    case "DELETE_CATEGORY":
      await hotelSync.syncDeleteCategory(action.categoryId);
      return;
    case "ADD_PRODUCT":
      await hotelSync.syncAddProduct(action.product);
      return;
    case "UPDATE_PRODUCT":
      await hotelSync.syncUpdateProduct(action.product);
      return;
    case "DELETE_PRODUCT":
      await hotelSync.syncDeleteProduct(action.productId);
      return;
    case "TOGGLE_PRODUCT_AVAILABILITY": {
      const next = ctx.toggleNextAvailable;
      if (next === undefined) return;
      await hotelSync.syncSetProductAvailability(action.productId, next);
      return;
    }
    case "ADD_ROOM":
      await hotelSync.syncAddRoom(action.room);
      return;
    case "DELETE_ROOM":
      await hotelSync.syncDeleteRoom(action.roomId);
      return;
    default:
      return;
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
  /** When true, domain data is loaded and synced via Prisma (Server Actions), not only localStorage. */
  useDatabase: boolean;
  databaseSyncing: boolean;
  databaseSyncError: string | null;
  /** Re-fetch rooms/orders/catalog from the database (no-op when `useDatabase` is false). */
  refreshDomainFromServer: () => Promise<void>;
  /** First server snapshot finished (or failed); always true when not using the database. */
  initialDomainHydrated: boolean;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({
  children,
  useDatabase = false,
}: {
  children: ReactNode;
  /** Set from `HRE_USE_DATABASE` in root layout — persists catalog, rooms, orders, etc. in SQLite/Postgres. */
  useDatabase?: boolean;
}) {
  const [state, dispatchCore] = useReducer(reducer, undefined, defaultState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const [databaseSyncing, setDatabaseSyncing] = useState(false);
  const [databaseSyncError, setDatabaseSyncError] = useState<string | null>(
    null,
  );
  const [initialDomainHydrated, setInitialDomainHydrated] = useState(
    () => !useDatabase,
  );

  const guestPostSessionEndNavRef = useRef({ skipDurationRedirectOnce: false });
  const armGuestNavToRatingAfterSessionEnd = useCallback(() => {
    guestPostSessionEndNavRef.current.skipDurationRedirectOnce = true;
  }, []);

  useEffect(() => {
    if (useDatabase) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = normalizePersistedPayload(
        JSON.parse(raw) as Partial<PersistedState>,
      );
      dispatchCore({ type: "HYDRATE", payload: parsed });
    } catch {
      /* ignore */
    }
  }, [useDatabase]);

  /** Other browser tabs (e.g. guest tablet + concierge) share `localStorage` — stay in sync without DB. */
  useEffect(() => {
    if (useDatabase) return;
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY || e.newValue == null) return;
      try {
        const parsed = normalizePersistedPayload(
          JSON.parse(e.newValue) as Partial<PersistedState>,
        );
        dispatchCore({ type: "HYDRATE", payload: parsed });
      } catch {
        /* ignore */
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [useDatabase]);

  const refreshDomainFromServer = useCallback(async () => {
    if (!useDatabase) return;
    try {
      const server = await hotelSync.loadDomainSnapshot();
      dispatchCore({
        type: "HYDRATE",
        payload: mergeDbHydrate(server, {
          guestSession: stateRef.current.guestSession,
          cart: stateRef.current.cart,
          locale: stateRef.current.locale,
          theme: stateRef.current.theme,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  }, [useDatabase]);

  useEffect(() => {
    if (!useDatabase) return;
    let cancelled = false;
    void (async () => {
      let guestSession: GuestSession | null = null;
      let cart: CartLine[] = [];
      let locale: Locale = "en";
      let theme: Theme = "dark";
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Record<string, unknown>;
          if (parsed.guestSession && typeof parsed.guestSession === "object") {
            guestSession = parsed.guestSession as GuestSession;
          }
          if (Array.isArray(parsed.cart)) {
            cart = parsed.cart as CartLine[];
          }
          if (isLocale(parsed.locale)) locale = parsed.locale;
          if (parsed.theme === "light" || parsed.theme === "dark") {
            theme = parsed.theme;
          }
        }
      } catch {
        /* ignore */
      }
      try {
        const server = await hotelSync.loadDomainSnapshot();
        if (!cancelled) {
          dispatchCore({
            type: "HYDRATE",
            payload: mergeDbHydrate(server, {
              guestSession,
              cart,
              locale,
              theme,
            }),
          });
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setDatabaseSyncError(
            e instanceof Error ? e.message : "Could not load database",
          );
        }
      } finally {
        if (!cancelled) setInitialDomainHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [useDatabase]);

  const dispatch = useCallback(
    (action: Action) => {
      const ctx: DbSyncCtx = {};
      let effectiveAction: Action = action;

      if (useDatabase) {
        if (action.type === "END_GUEST_SESSION") {
          ctx.guestSessionEndRoom = stateRef.current.guestSession?.roomNumber;
        }
        if (action.type === "EXTEND_GUEST_SESSION") {
          const gs = stateRef.current.guestSession;
          if (gs) {
            ctx.guestExtendRoom = gs.roomNumber;
            ctx.guestExtendEndsAt =
              gs.sessionEndsAt + action.extraHours * 60 * 60 * 1000;
          }
        }
        if (action.type === "TOGGLE_PRODUCT_AVAILABILITY") {
          const p = stateRef.current.catalog.find(
            (x) => x.id === action.productId,
          );
          ctx.toggleNextAvailable = !(p?.available ?? true);
        }
        if (action.type === "PANIC") {
          const at = Date.now();
          effectiveAction = {
            ...action,
            alertId: `panic-${crypto.randomUUID()}`,
            at,
          };
        }
        if (action.type === "SUBMIT_GUEST_RATING") {
          effectiveAction = {
            ...action,
            ratingId: `rate-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          };
        }
      }

      dispatchCore(effectiveAction);

      if (!useDatabase || !isDbSyncedAction(effectiveAction)) return;

      void (async () => {
        setDatabaseSyncing(true);
        setDatabaseSyncError(null);
        try {
          await pushActionToDatabase(effectiveAction, ctx);
          const server = await hotelSync.loadDomainSnapshot();
          dispatchCore({
            type: "HYDRATE",
            payload: mergeDbHydrate(server, {
              guestSession: stateRef.current.guestSession,
              cart: stateRef.current.cart,
              locale: stateRef.current.locale,
              theme: stateRef.current.theme,
            }),
          });
        } catch (e) {
          console.error(e);
          setDatabaseSyncError(
            e instanceof Error ? e.message : "Database sync failed",
          );
          try {
            const server = await hotelSync.loadDomainSnapshot();
            dispatchCore({
              type: "HYDRATE",
              payload: mergeDbHydrate(server, {
                guestSession: stateRef.current.guestSession,
                cart: stateRef.current.cart,
                locale: stateRef.current.locale,
                theme: stateRef.current.theme,
              }),
            });
          } catch {
            /* ignore */
          }
        } finally {
          setDatabaseSyncing(false);
        }
      })();
    },
    [useDatabase],
  );

  useEffect(() => {
    try {
      if (useDatabase) {
        const slice = {
          guestSession: state.guestSession,
          cart: state.cart,
          locale: state.locale,
          theme: state.theme,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(slice));
        return;
      }
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      /* ignore */
    }
  }, [
    useDatabase,
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
    state.cart,
  ]);

  const productById = useCallback(
    (id: string) => state.catalog.find((p) => p.id === id),
    [state.catalog],
  );

  const addToCart = useCallback((productId: string, qty = 1) => {
    dispatch({ type: "CART_ADD", productId, qty });
  }, [dispatch]);

  const setCartQty = useCallback(
    (productId: string, qty: number) => {
      const lines = state.cart
        .map((l) =>
          l.productId === productId ? { ...l, qty: Math.max(0, qty) } : l,
        )
        .filter((l) => l.qty > 0);
      dispatch({ type: "CART_SET", lines });
    },
    [state.cart, dispatch],
  );

  const removeCartLine = useCallback(
    (productId: string) => {
      dispatch({
        type: "CART_SET",
        lines: state.cart.filter((l) => l.productId !== productId),
      });
    },
    [state.cart, dispatch],
  );

  const clearCart = useCallback(() => {
    dispatch({ type: "CART_SET", lines: [] });
  }, [dispatch]);

  const setLocale = useCallback(
    (locale: Locale) => {
      dispatch({ type: "SET_LOCALE", locale });
    },
    [dispatch],
  );

  const setTheme = useCallback(
    (theme: Theme) => {
      dispatch({ type: "SET_THEME", theme });
    },
    [dispatch],
  );

  const toggleTheme = useCallback(() => {
    dispatch({
      type: "SET_THEME",
      theme: state.theme === "dark" ? "light" : "dark",
    });
  }, [state.theme, dispatch]);

  useLayoutEffect(() => {
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
      useDatabase,
      databaseSyncing,
      databaseSyncError,
      refreshDomainFromServer,
      initialDomainHydrated,
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
      dispatch,
      useDatabase,
      databaseSyncing,
      databaseSyncError,
      refreshDomainFromServer,
      initialDomainHydrated,
    ],
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
