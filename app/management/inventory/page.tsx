"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ManagementShell } from "@/components/management-shell";
import {
  MAX_PRODUCT_IMAGE_FILE_BYTES,
  ProductThumb,
} from "@/components/product-thumb";
import { useDemo, type Action } from "@/contexts/demo-context";
import {
  categoryBadgeClass,
  categoryLabel,
  CATEGORY_COLOR_OPTIONS,
} from "@/lib/category-styles";
import { formatSrd } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { Category, Locale, Product, ProductCategory } from "@/lib/types";

type Dispatch = React.Dispatch<Action>;

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative h-7 w-12 rounded-full transition ${on ? "bg-[var(--gold)]" : "bg-[var(--surface)]"}`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "left-[calc(100%-1.625rem)]" : "left-0.5"}`}
      />
    </button>
  );
}

export default function ManagementInventoryPage() {
  const { locale, catalog, categories, dispatch } = useDemo();

  return (
    <ManagementShell>
      <div className="px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[var(--gold)]">
            {t(locale, "mgmtTabInventory")}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {t(locale, "mgmtInventorySub")}
          </p>
        </div>
        <CategoriesPanel
          locale={locale}
          categories={categories}
          dispatch={dispatch}
        />
        <InventoryContent
          locale={locale}
          catalog={catalog}
          categories={categories}
          dispatch={dispatch}
        />
      </div>
    </ManagementShell>
  );
}

function CategoriesPanel({
  locale,
  categories,
  dispatch,
}: {
  locale: Locale;
  categories: Category[];
  dispatch: Dispatch;
}) {
  const [editing, setEditing] = useState<Category | null>(null);
  const [isNew, setIsNew] = useState(false);

  function openNew() {
    setEditing({
      id: `cat-${Date.now()}`,
      name: "",
      color: "sky",
    });
    setIsNew(true);
  }

  function saveCategory() {
    if (!editing || !editing.name.trim()) return;
    if (isNew) {
      dispatch({ type: "ADD_CATEGORY", category: editing });
    } else {
      dispatch({ type: "UPDATE_CATEGORY", category: editing });
    }
    setEditing(null);
  }

  function deleteCategory(id: string) {
    if (window.confirm(t(locale, "mgmtDeleteCategoryConfirm"))) {
      dispatch({ type: "DELETE_CATEGORY", categoryId: id });
      setEditing(null);
    }
  }

  return (
    <section className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[var(--gold)]">
          {t(locale, "mgmtCategories")}
        </h2>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-2 rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-4 py-2 text-sm font-bold text-[var(--gold)] transition hover:bg-[var(--gold)]/20"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          {t(locale, "mgmtAddCategory")}
        </button>
      </div>
      {categories.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          {t(locale, "mgmtNoCategoriesYet")}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setEditing({ ...c });
                setIsNew(false);
              }}
              className={`flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-bold transition hover:bg-[var(--surface)]`}
            >
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${categoryBadgeClass(c.color)}`}
              >
                {c.name}
              </span>
              <span className="text-[var(--muted)]">·</span>
              <span className="text-xs text-[var(--muted)]">{c.id}</span>
            </button>
          ))}
        </div>
      )}

      {editing && (
        <CategoryModal
          category={editing}
          setCategory={setEditing}
          isNew={isNew}
          locale={locale}
          onSave={saveCategory}
          onDelete={() => deleteCategory(editing.id)}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}

function CategoryModal({
  category,
  setCategory,
  isNew,
  locale,
  onSave,
  onDelete,
  onClose,
}: {
  category: Category;
  setCategory: (c: Category | null) => void;
  isNew: boolean;
  locale: Locale;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const set = (patch: Partial<Category>) =>
    setCategory({ ...category, ...patch });
  const canSave = Boolean(category.name.trim());

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6 backdrop-blur-md">
      <div className="animate-fade-in-scale w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h3 className="text-lg font-bold text-[var(--gold)]">
            {isNew
              ? t(locale, "mgmtAddCategory")
              : t(locale, "mgmtEditCategory")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface)]"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              {t(locale, "mgmtCategoryName")}
            </label>
            <input
              type="text"
              value={category.name}
              onChange={(e) => set({ name: e.target.value })}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              {t(locale, "mgmtCategoryColor")}
            </label>
            <select
              value={category.color}
              onChange={(e) => set({ color: e.target.value })}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
            >
              {CATEGORY_COLOR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {!isNew && (
            <p className="text-xs text-[var(--muted)]">
              ID:{" "}
              <code className="rounded bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[11px]">
                {category.id}
              </code>
            </p>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-[var(--border)] px-6 py-4">
          <div>
            {!isNew && (
              <button
                type="button"
                onClick={onDelete}
                className="text-sm font-bold text-red-400 transition hover:text-red-300"
              >
                {t(locale, "mgmtDeleteCategory")}
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-bold text-[var(--foreground)] transition hover:bg-[var(--surface)]"
            >
              {t(locale, "mgmtCancel")}
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={!canSave}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${canSave ? "bg-[var(--gold)] text-[var(--dark)] hover:bg-[var(--gold-light)]" : "cursor-not-allowed bg-[var(--surface)] text-[var(--muted)]"}`}
            >
              {t(locale, "mgmtSave")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InventoryContent({
  locale,
  catalog,
  categories,
  dispatch,
}: {
  locale: Locale;
  catalog: Product[];
  categories: Category[];
  dispatch: Dispatch;
}) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<ProductCategory | "all">("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);

  const defaultCatId = categories[0]?.id ?? "drink";

  const effectiveCatFilter = useMemo(() => {
    if (catFilter === "all") return "all";
    return categories.some((c) => c.id === catFilter) ? catFilter : "all";
  }, [catFilter, categories]);

  const filtered = useMemo(() => {
    let list = catalog;
    if (effectiveCatFilter !== "all")
      list = list.filter((p) => p.category === effectiveCatFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [catalog, effectiveCatFilter, search]);

  function openNew() {
    setEditingProduct({
      id: `p${Date.now()}`,
      name: "",
      priceSrd: 0,
      category: defaultCatId,
      image: "",
      available: true,
    });
    setIsNew(true);
  }

  function openEdit(p: Product) {
    setEditingProduct({ ...p });
    setIsNew(false);
  }

  function saveProduct() {
    if (!editingProduct) return;
    if (isNew) {
      dispatch({ type: "ADD_PRODUCT", product: editingProduct });
    } else {
      dispatch({ type: "UPDATE_PRODUCT", product: editingProduct });
    }
    setEditingProduct(null);
  }

  function deleteProduct(id: string) {
    if (window.confirm(t(locale, "mgmtDeleteProductConfirm"))) {
      dispatch({ type: "DELETE_PRODUCT", productId: id });
      setEditingProduct(null);
    }
  }

  const toggleAvailability = useCallback(
    (id: string) => {
      dispatch({ type: "TOGGLE_PRODUCT_AVAILABILITY", productId: id });
    },
    [dispatch],
  );

  const catCounts = useMemo(() => {
    const map: Record<string, number> = { all: catalog.length };
    catalog.forEach((p) => {
      map[p.category] = (map[p.category] ?? 0) + 1;
    });
    return map;
  }, [catalog]);

  const filterTabs = useMemo(() => {
    const tabs: { id: ProductCategory | "all"; label: string }[] = [
      { id: "all", label: t(locale, "mgmtAllCategories") },
      ...categories.map((c) => ({
        id: c.id,
        label: c.name,
      })),
    ];
    return tabs;
  }, [categories, locale]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(locale, "mgmtSearchProducts")}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
          />
        </div>
        <div className="flex max-w-full flex-wrap gap-1 rounded-lg bg-[var(--surface)] p-0.5">
          {filterTabs.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCatFilter(c.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                effectiveCatFilter === c.id
                  ? "bg-[var(--gold)] text-[var(--dark)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {c.label} ({catCounts[c.id] ?? 0})
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-[var(--gold)] px-4 py-2.5 text-sm font-bold text-[var(--dark)] transition hover:bg-[var(--gold-light)] active:scale-[0.98]"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          {t(locale, "mgmtAddProduct")}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-6 py-12 text-center">
          <p className="text-sm text-[var(--muted)]">
            {t(locale, "mgmtNoProducts")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const catMeta = categories.find((c) => c.id === p.category);
            const badgeClass = categoryBadgeClass(catMeta?.color ?? "purple");
            const badgeLabel = categoryLabel(categories, p.category);
            return (
              <div
                key={p.id}
                className={`group flex items-center gap-4 rounded-2xl border bg-[var(--card)] px-4 py-3 shadow-sm transition hover:shadow-md ${
                  p.available
                    ? "border-[var(--border)]"
                    : "border-red-500/20 opacity-60"
                }`}
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[var(--surface)]">
                  {p.image ? (
                    <ProductThumb
                      src={p.image}
                      alt={p.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[var(--muted)]">
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-[var(--foreground)]">
                      {p.name}
                    </p>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${badgeClass}`}
                    >
                      {badgeLabel}
                    </span>
                  </div>
                </div>
                <p className="text-base font-black text-[var(--gold)]">
                  {formatSrd(p.priceSrd)}
                </p>
                <Toggle
                  on={p.available}
                  onToggle={() => toggleAvailability(p.id)}
                />
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--gold)]"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.75}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {editingProduct && (
        <ProductModal
          product={editingProduct}
          setProduct={setEditingProduct}
          categories={categories}
          isNew={isNew}
          locale={locale}
          onSave={saveProduct}
          onDelete={() => deleteProduct(editingProduct.id)}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  );
}

function ProductModal({
  product,
  setProduct,
  categories,
  isNew,
  locale,
  onSave,
  onDelete,
  onClose,
}: {
  product: Product;
  setProduct: React.Dispatch<React.SetStateAction<Product | null>>;
  categories: Category[];
  isNew: boolean;
  locale: Locale;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const set = (patch: Partial<Product>) =>
    setProduct((prev) => (prev ? { ...prev, ...patch } : prev));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragActive, setDragActive] = useState(false);
  const [uploadHint, setUploadHint] = useState<string | null>(null);

  const canSave =
    product.name.trim() &&
    product.priceSrd > 0 &&
    categories.length > 0;

  const urlInputValue = product.image.startsWith("data:") ? "" : product.image;

  const applyImageFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setUploadHint(t(locale, "mgmtProductImageInvalid"));
        return;
      }
      if (file.size > MAX_PRODUCT_IMAGE_FILE_BYTES) {
        setUploadHint(t(locale, "mgmtProductImageTooLarge"));
        return;
      }
      setUploadHint(null);
      const reader = new FileReader();
      reader.onload = () => {
        const r = reader.result;
        if (typeof r === "string")
          setProduct((prev) => (prev ? { ...prev, image: r } : prev));
      };
      reader.onerror = () => {
        setUploadHint(t(locale, "mgmtProductImageReadError"));
      };
      reader.readAsDataURL(file);
    },
    [locale, setProduct],
  );

  useEffect(() => {
    setUploadHint(null);
    setDragActive(false);
    dragDepth.current = 0;
  }, [product.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-md">
      <div className="animate-fade-in-scale w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h3 className="text-lg font-bold text-[var(--gold)]">
            {isNew ? t(locale, "mgmtAddProduct") : t(locale, "mgmtEditProduct")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          {product.image && (
            <div className="relative h-32 w-full overflow-hidden rounded-xl bg-[var(--surface)]">
              <ProductThumb
                src={product.image}
                alt={product.name || "Preview"}
                fill
                className="object-cover"
                sizes="500px"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              {t(locale, "mgmtProductName")}
            </label>
            <input
              type="text"
              value={product.name}
              onChange={(e) => set({ name: e.target.value })}
              className="box-border h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm leading-normal text-[var(--foreground)] outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                {t(locale, "mgmtProductPrice")}
              </label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={product.priceSrd}
                onChange={(e) => set({ priceSrd: Number(e.target.value) })}
                className="box-border h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm leading-normal text-[var(--foreground)] outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                {t(locale, "mgmtProductCategory")}
              </label>
              {categories.length === 0 ? (
                <p className="text-xs text-amber-400">
                  {t(locale, "mgmtNoCategoriesYet")}
                </p>
              ) : (
                <select
                  value={product.category}
                  onChange={(e) =>
                    set({ category: e.target.value as ProductCategory })
                  }
                  className="box-border h-11 w-full cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm leading-normal text-[var(--foreground)] outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              {t(locale, "mgmtProductImage")}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                applyImageFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dragDepth.current += 1;
                setDragActive(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dragDepth.current = Math.max(0, dragDepth.current - 1);
                if (dragDepth.current === 0) setDragActive(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dragDepth.current = 0;
                setDragActive(false);
                applyImageFile(e.dataTransfer.files?.[0]);
              }}
              className={`flex min-h-[7.5rem] w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-5 text-center transition ${
                dragActive
                  ? "border-[var(--gold)] bg-[var(--gold)]/10"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--gold)]/45 hover:bg-[var(--card-hover)]"
              }`}
            >
              <svg
                className="h-9 w-9 shrink-0 text-[var(--gold)]/85"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm font-bold text-[var(--foreground)]">
                {t(locale, "mgmtProductImageDropzone")}
              </span>
              <span className="max-w-xs text-xs text-[var(--muted)]">
                {t(locale, "mgmtProductImageDropzoneSub")}
              </span>
            </button>
            {uploadHint ? (
              <p className="mt-2 text-xs font-semibold text-red-400">{uploadHint}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              {t(locale, "mgmtProductImageUrl")}
            </label>
            <input
              type="url"
              value={urlInputValue}
              onChange={(e) => set({ image: e.target.value })}
              placeholder={t(locale, "mgmtProductImageUrlPlaceholder")}
              className="box-border h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm leading-normal text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
            />
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-[var(--border)] px-6 py-4">
          <div>
            {!isNew && (
              <button
                type="button"
                onClick={onDelete}
                className="text-sm font-bold text-red-400 transition hover:text-red-300"
              >
                {t(locale, "mgmtDeleteProduct")}
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-bold text-[var(--foreground)] transition hover:bg-[var(--surface)]"
            >
              {t(locale, "mgmtCancel")}
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={!canSave}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${canSave ? "bg-[var(--gold)] text-[var(--dark)] hover:bg-[var(--gold-light)] active:scale-[0.98]" : "cursor-not-allowed bg-[var(--surface)] text-[var(--muted)]"}`}
            >
              {t(locale, "mgmtSave")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
