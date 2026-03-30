"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import {
  catalog,
  HOURLY_RATE_SRD,
  initialOrders,
  initialRooms,
} from "@/lib/mock-data";
import type {
  Locale,
  Order,
  PanicAlert,
  Product,
  Room,
  RoomStatus,
} from "@/lib/types";

const STORAGE_KEY = "hre-demo-v2";

export interface CartLine {
  productId: string;
  qty: number;
}

interface GuestSession {
  roomNumber: string;
  durationHours: 2 | 3;
  sessionEndsAt: number;
  sessionStartedAt: number;
}

interface PersistedState {
  rooms: Room[];
  orders: Order[];
  panicAlerts: PanicAlert[];
  guestSession: GuestSession | null;
  locale: Locale;
}

type Action =
  | { type: "HYDRATE"; payload: Partial<PersistedState> }
  | { type: "SET_LOCALE"; locale: Locale }
  | { type: "START_GUEST_SESSION"; roomNumber: string; durationHours: 2 | 3 }
  | { type: "EXTEND_GUEST_SESSION"; extraHours: number }
  | { type: "END_GUEST_SESSION" }
  | { type: "UPDATE_ROOM_STATUS"; roomId: string; status: RoomStatus }
  | {
      type: "START_ROOM_SESSION";
      roomId: string;
      durationHours: number;
    }
  | { type: "END_ROOM_SESSION"; roomId: string }
  | { type: "PANIC"; roomNumber: string }
  | { type: "CLEAR_PANICS" }
  | { type: "ADD_ORDER"; order: Order }
  | { type: "SET_ORDER_STATUS"; orderId: string; status: Order["status"] }
  | { type: "CART_SET"; lines: CartLine[] }
  | { type: "CART_ADD"; productId: string; qty?: number };

interface DemoState extends PersistedState {
  cart: CartLine[];
}

function defaultState(): DemoState {
  return {
    rooms: initialRooms(),
    orders: initialOrders(),
    panicAlerts: [],
    guestSession: null,
    locale: "en",
    cart: [],
  };
}

function reducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, ...action.payload, cart: state.cart };
    case "SET_LOCALE":
      return { ...state, locale: action.locale };
    case "START_GUEST_SESSION": {
      const now = Date.now();
      const ms = action.durationHours * 60 * 60 * 1000;
      const guestSession: GuestSession = {
        roomNumber: action.roomNumber,
        durationHours: action.durationHours,
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
              durationHours: action.durationHours,
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
              status: "available" as const,
              sessionEndsAt: undefined,
              sessionStartedAt: undefined,
              durationHours: undefined,
            }
          : r
      );
      return { ...state, guestSession: null, rooms, cart: [] };
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
    default:
      return state;
  }
}

interface DemoContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  rooms: Room[];
  orders: Order[];
  panicAlerts: PanicAlert[];
  guestSession: GuestSession | null;
  catalog: Product[];
  cart: CartLine[];
  hourlyRate: number;
  dispatch: React.Dispatch<Action>;
  productById: (id: string) => Product | undefined;
  addToCart: (productId: string, qty?: number) => void;
  setCartQty: (productId: string, qty: number) => void;
  removeCartLine: (productId: string) => void;
  clearCart: () => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, defaultState);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
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
      guestSession: state.guestSession,
      locale: state.locale,
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
    state.guestSession,
    state.locale,
  ]);

  const productById = useCallback(
    (id: string) => catalog.find((p) => p.id === id),
    []
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

  const value = useMemo<DemoContextValue>(
    () => ({
      locale: state.locale,
      setLocale,
      rooms: state.rooms,
      orders: state.orders,
      panicAlerts: state.panicAlerts,
      guestSession: state.guestSession,
      catalog,
      cart: state.cart,
      hourlyRate: HOURLY_RATE_SRD,
      dispatch,
      productById,
      addToCart,
      setCartQty,
      removeCartLine,
      clearCart,
    }),
    [
      state.locale,
      state.rooms,
      state.orders,
      state.panicAlerts,
      state.guestSession,
      state.cart,
      setLocale,
      productById,
      addToCart,
      setCartQty,
      removeCartLine,
      clearCart,
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
