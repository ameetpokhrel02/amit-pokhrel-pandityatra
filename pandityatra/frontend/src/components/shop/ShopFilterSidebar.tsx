import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Filter,
    X,
    RotateCcw,
    ChevronDown,
    Check,
    ArrowUpDown,
    SlidersHorizontal,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────
export interface FilterCategory {
    id: number;
    name: string;
    slug: string;
    icon?: string;
}

export interface ShopFilterSidebarProps {
    categories: FilterCategory[];
    selectedCategory: string;
    onCategoryChange: (catId: string) => void;
    sortBy: string;
    onSortChange: (sort: string) => void;
    priceRange: [number, number];
    onPriceRangeChange: (range: [number, number]) => void;
    maxPrice: number;
    totalItems: number;
    onReset: () => void;
    sortOptions?: { value: string; label: string }[];
}

const DEFAULT_SORT_OPTIONS = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-asc', label: 'Price: Low → High' },
    { value: 'price-desc', label: 'Price: High → Low' },
    { value: 'name-asc', label: 'Name: A → Z' },
];

// ─── Collapsible Section ─────────────────────────────
const FilterSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    defaultOpen?: boolean;
    onReset?: () => void;
    children: React.ReactNode;
}> = ({ title, icon, defaultOpen = true, onReset, children }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-gray-100 dark:border-gray-800 pb-5 mb-5 last:border-none last:mb-0 last:pb-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full group"
            >
                <div className="flex items-center gap-2.5">
                    <span className="text-orange-500">{icon}</span>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        {title}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    {onReset && (
                        <span
                            onClick={(e) => { e.stopPropagation(); onReset(); }}
                            className="text-[11px] text-orange-500 hover:text-orange-700 font-semibold cursor-pointer"
                        >
                            Reset
                        </span>
                    )}
                    <ChevronDown
                        className={cn(
                            "w-4 h-4 text-gray-400 transition-transform duration-200",
                            isOpen && "rotate-180"
                        )}
                    />
                </div>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-4">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Sidebar Content (shared between desktop & mobile) ──
const SidebarContent: React.FC<ShopFilterSidebarProps> = ({
    categories,
    selectedCategory,
    onCategoryChange,
    sortBy,
    onSortChange,
    priceRange,
    onPriceRangeChange,
    maxPrice,
    totalItems,
    onReset,
    sortOptions = DEFAULT_SORT_OPTIONS,
}) => {
    const hasActiveFilters =
        selectedCategory !== 'all' ||
        priceRange[0] > 0 ||
        priceRange[1] < maxPrice ||
        sortBy !== 'featured';

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <SlidersHorizontal className="w-4.5 h-4.5 text-orange-600" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Filters</h2>
                        <p className="text-[11px] text-gray-500">{totalItems} items</p>
                    </div>
                </div>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onReset}
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/20 gap-1.5 text-xs font-semibold h-8"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset All
                    </Button>
                )}
            </div>

            {/* Scrollable filters */}
            <div className="flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar">

                {/* ── Categories ── */}
                {categories.length > 0 && (
                    <FilterSection
                        title="Category"
                        icon={<Filter className="w-4 h-4" />}
                        onReset={() => onCategoryChange('all')}
                    >
                        <Select value={selectedCategory} onValueChange={onCategoryChange}>
                            <SelectTrigger className="w-full h-11 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:border-orange-400 focus:ring-orange-400/20">
                                <div className="flex items-center gap-2.5">
                                    {(() => {
                                        if (selectedCategory === 'all') {
                                            return (
                                                <>
                                                    <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center flex-shrink-0">
                                                        <LucideIcons.LayoutGrid className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="font-medium">All Items</span>
                                                </>
                                            );
                                        }
                                        const cat = categories.find(c => c.id.toString() === selectedCategory);
                                        if (cat) {
                                            const Icon = (LucideIcons as any)[cat.icon || 'Flower2'] || LucideIcons.Flower2;
                                            return (
                                                <>
                                                    <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center flex-shrink-0">
                                                        <Icon className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="font-medium">{cat.name}</span>
                                                </>
                                            );
                                        }
                                        return <SelectValue placeholder="Select category" />;
                                    })()}
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all" className="py-2.5 rounded-lg">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                            <LucideIcons.LayoutGrid className="w-3.5 h-3.5 text-gray-600" />
                                        </div>
                                        All Items
                                    </div>
                                </SelectItem>
                                {categories.map((cat) => {
                                    const IconComp = (LucideIcons as any)[cat.icon || 'Flower2'] || LucideIcons.Flower2;
                                    return (
                                        <SelectItem key={cat.id} value={cat.id.toString()} className="py-2.5 rounded-lg">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                    <IconComp className="w-3.5 h-3.5 text-orange-500" />
                                                </div>
                                                {cat.name}
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </FilterSection>
                )}

                {/* ── Price Range ── */}
                <FilterSection
                    title="Price Range"
                    icon={<LucideIcons.IndianRupee className="w-4 h-4" />}
                    onReset={() => onPriceRangeChange([0, maxPrice])}
                >
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">₹</span>
                                <Input
                                    type="number"
                                    placeholder="Min"
                                    value={priceRange[0] || ''}
                                    onChange={(e) => onPriceRangeChange([Number(e.target.value) || 0, priceRange[1]])}
                                    className="pl-7 h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg focus:border-orange-400"
                                />
                            </div>
                            <span className="text-gray-300 text-xs font-bold">—</span>
                            <div className="flex-1 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">₹</span>
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    value={priceRange[1] === maxPrice ? '' : priceRange[1]}
                                    onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value) || maxPrice])}
                                    className="pl-7 h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg focus:border-orange-400"
                                />
                            </div>
                        </div>
                        {/* Quick Price Badges */}
                        <div className="flex flex-wrap gap-1.5">
                            {[500, 1000, 2000, 5000].filter(p => p <= maxPrice).map(price => (
                                <Badge
                                    key={price}
                                    variant="outline"
                                    onClick={() => onPriceRangeChange([0, price])}
                                    className={cn(
                                        "cursor-pointer text-[11px] font-medium transition-all",
                                        priceRange[1] === price
                                            ? "bg-orange-50 border-orange-300 text-orange-700 dark:bg-orange-950/30 dark:border-orange-700 dark:text-orange-400"
                                            : "hover:bg-orange-50 hover:border-orange-200 dark:hover:bg-orange-950/20"
                                    )}
                                >
                                    Under ₹{price.toLocaleString()}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </FilterSection>

                {/* ── Sort By ── */}
                <FilterSection
                    title="Sort By"
                    icon={<ArrowUpDown className="w-4 h-4" />}
                >
                    <div className="space-y-1">
                        {sortOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => onSortChange(opt.value)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                                    sortBy === opt.value
                                        ? "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 font-semibold border border-orange-200 dark:border-orange-800"
                                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                )}
                            >
                                <span>{opt.label}</span>
                                {sortBy === opt.value && (
                                    <Check className="w-4 h-4 text-orange-600" />
                                )}
                            </button>
                        ))}
                    </div>
                </FilterSection>
            </div>
        </div>
    );
};

// ─── Main Export: Desktop Sidebar + Mobile Sheet ─────
const ShopFilterSidebar: React.FC<ShopFilterSidebarProps> = (props) => {
    const [mobileOpen, setMobileOpen] = useState(false);

    const hasActiveFilters =
        props.selectedCategory !== 'all' ||
        props.priceRange[0] > 0 ||
        props.priceRange[1] < props.maxPrice ||
        props.sortBy !== 'featured';

    return (
        <>
            {/* ── Desktop Sidebar ── */}
            <aside className="hidden lg:block w-[280px] flex-shrink-0">
                <div className="sticky top-28 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 max-h-[calc(100vh-140px)] overflow-hidden flex flex-col">
                    <SidebarContent {...props} />
                </div>
            </aside>

            {/* ── Mobile Filter Button ── */}
            <div className="lg:hidden">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full h-11 flex items-center justify-between px-5 rounded-2xl border-orange-200 bg-white text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:bg-gray-900 dark:text-orange-400 dark:hover:bg-orange-950/20 shadow-sm mb-6"
                        >
                            <div className="flex items-center gap-2.5">
                                <SlidersHorizontal className="w-4.5 h-4.5" />
                                <span className="font-bold">Filters & Sorting</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-medium text-gray-500">{props.totalItems} items</span>
                                {hasActiveFilters && (
                                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                )}
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            </div>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="rounded-t-3xl h-[85vh] p-0">
                        <div className="h-full flex flex-col">
                            <SheetHeader className="p-5 pb-0 border-b border-gray-100 dark:border-gray-800">
                                <div className="flex items-center justify-between">
                                    <SheetTitle className="text-lg font-bold">Filters</SheetTitle>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setMobileOpen(false)}
                                        className="rounded-full"
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                            </SheetHeader>
                            <div className="flex-1 overflow-y-auto p-5">
                                <SidebarContent {...props} />
                            </div>
                            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                                <Button
                                    onClick={() => setMobileOpen(false)}
                                    className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg"
                                >
                                    Show {props.totalItems} Results
                                </Button>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
};

export default ShopFilterSidebar;
