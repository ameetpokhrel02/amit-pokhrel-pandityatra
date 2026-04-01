from django.db.models import Q
from bookings.models import Booking
from samagri.models import SamagriItem, PujaSamagriRequirement
from pandits.models import PanditUser
from chat.models import ChatRoom
from services.models import Puja
from .schemas import ToolExecutionResult
from .constants import RESPONSE_TYPES


PUJA_ITEM_PATTERNS = {
    "birthday": [
        {"name": "Rice", "quantity": 1, "unit": "kg"},
        {"name": "Milk", "quantity": 1, "unit": "litre"},
        {"name": "Sweets", "quantity": 1, "unit": "box"},
        {"name": "Diya", "quantity": 2, "unit": "pcs"},
        {"name": "Flowers", "quantity": 1, "unit": "pack"},
        {"name": "Incense Sticks", "quantity": 1, "unit": "pack"},
        {"name": "Fruits", "quantity": 1, "unit": "pack"},
    ],
    "naming": [
        {"name": "Kalash", "quantity": 1, "unit": "pcs"},
        {"name": "Rice", "quantity": 1, "unit": "kg"},
        {"name": "Ghee", "quantity": 250, "unit": "ml"},
        {"name": "Incense Sticks", "quantity": 1, "unit": "pack"},
        {"name": "Diya", "quantity": 2, "unit": "pcs"},
        {"name": "Flowers", "quantity": 1, "unit": "pack"},
        {"name": "Honey", "quantity": 1, "unit": "bottle"},
        {"name": "Curd", "quantity": 500, "unit": "ml"},
        {"name": "Banana", "quantity": 5, "unit": "pcs"},
        {"name": "Coconut", "quantity": 1, "unit": "pcs"},
    ],
    "bratabandha": [
        {"name": "Kalash", "quantity": 1, "unit": "pcs"},
        {"name": "Ghee", "quantity": 250, "unit": "ml"},
        {"name": "Rice", "quantity": 1, "unit": "kg"},
        {"name": "Incense Sticks", "quantity": 1, "unit": "pack"},
        {"name": "Rudraksha", "quantity": 1, "unit": "pcs"},
        {"name": "Sacred Thread", "quantity": 1, "unit": "pcs"},
        {"name": "Diya", "quantity": 2, "unit": "pcs"},
        {"name": "Flowers", "quantity": 1, "unit": "pack"},
        {"name": "Betel Nut", "quantity": 5, "unit": "pcs"},
    ],
    "bibaha": [
        {"name": "Sindoor", "quantity": 1, "unit": "box"},
        {"name": "Mangalsutra", "quantity": 1, "unit": "pcs"},
        {"name": "Ghee", "quantity": 250, "unit": "ml"},
        {"name": "Rice", "quantity": 1, "unit": "kg"},
        {"name": "Betel Leaves", "quantity": 10, "unit": "pcs"},
        {"name": "Coconut", "quantity": 2, "unit": "pcs"},
        {"name": "Flowers", "quantity": 1, "unit": "pack"},
        {"name": "Haldi", "quantity": 1, "unit": "pack"},
        {"name": "Kumkum", "quantity": 1, "unit": "pack"},
        {"name": "Diya", "quantity": 2, "unit": "pcs"},
    ],
    "pasni": [
        {"name": "Rice", "quantity": 1, "unit": "kg"},
        {"name": "Ghee", "quantity": 250, "unit": "ml"},
        {"name": "Honey", "quantity": 1, "unit": "bottle"},
        {"name": "Curd", "quantity": 500, "unit": "ml"},
        {"name": "Banana", "quantity": 6, "unit": "pcs"},
        {"name": "Diya", "quantity": 2, "unit": "pcs"},
        {"name": "Flowers", "quantity": 1, "unit": "pack"},
    ],
    "satyanarayan": [
        {"name": "Ghee", "quantity": 250, "unit": "ml"},
        {"name": "Rice", "quantity": 1, "unit": "kg"},
        {"name": "Banana", "quantity": 6, "unit": "pcs"},
        {"name": "Coconut", "quantity": 2, "unit": "pcs"},
        {"name": "Betel Nut", "quantity": 5, "unit": "pcs"},
        {"name": "Incense Sticks", "quantity": 1, "unit": "pack"},
        {"name": "Flowers", "quantity": 1, "unit": "pack"},
        {"name": "Laddu", "quantity": 1, "unit": "box"},
    ],
    "ganesh": [
        {"name": "Modak", "quantity": 1, "unit": "box"},
        {"name": "Ghee", "quantity": 250, "unit": "ml"},
        {"name": "Rice", "quantity": 1, "unit": "kg"},
        {"name": "Durva Grass", "quantity": 1, "unit": "bunch"},
        {"name": "Red Flowers", "quantity": 1, "unit": "pack"},
        {"name": "Coconut", "quantity": 1, "unit": "pcs"},
        {"name": "Incense Sticks", "quantity": 1, "unit": "pack"},
    ],
    "saraswati": [
        {"name": "Books", "quantity": 1, "unit": "set"},
        {"name": "Pen", "quantity": 1, "unit": "pcs"},
        {"name": "Ink", "quantity": 1, "unit": "bottle"},
        {"name": "Ghee", "quantity": 250, "unit": "ml"},
        {"name": "Rice", "quantity": 1, "unit": "kg"},
        {"name": "White Flowers", "quantity": 1, "unit": "pack"},
        {"name": "Diya", "quantity": 2, "unit": "pcs"},
        {"name": "Incense Sticks", "quantity": 1, "unit": "pack"},
        {"name": "Fruits", "quantity": 1, "unit": "pack"},
    ],
    "laxmi": [
        {"name": "Coins", "quantity": 5, "unit": "pcs"},
        {"name": "Lotus Flowers", "quantity": 1, "unit": "pack"},
        {"name": "Ghee", "quantity": 250, "unit": "ml"},
        {"name": "Rice", "quantity": 1, "unit": "kg"},
        {"name": "Diya", "quantity": 4, "unit": "pcs"},
        {"name": "Incense Sticks", "quantity": 1, "unit": "pack"},
        {"name": "Lakshmi Idol", "quantity": 1, "unit": "pcs"},
        {"name": "Sweets", "quantity": 1, "unit": "box"},
    ],
    "teej": [
        {"name": "Ghee", "quantity": 250, "unit": "ml"},
        {"name": "Rice", "quantity": 1, "unit": "kg"},
        {"name": "Red Sindoor", "quantity": 1, "unit": "box"},
        {"name": "Mehendi", "quantity": 1, "unit": "pack"},
        {"name": "Flowers", "quantity": 1, "unit": "pack"},
        {"name": "Fruits", "quantity": 1, "unit": "pack"},
        {"name": "Diya", "quantity": 2, "unit": "pcs"},
    ],
    "dashain": [
        {"name": "Tika", "quantity": 1, "unit": "pack"},
        {"name": "Jamara", "quantity": 1, "unit": "pack"},
        {"name": "Ghee", "quantity": 250, "unit": "ml"},
        {"name": "Diya", "quantity": 2, "unit": "pcs"},
        {"name": "Incense Sticks", "quantity": 1, "unit": "pack"},
        {"name": "Fruits", "quantity": 1, "unit": "pack"},
        {"name": "Sweets", "quantity": 1, "unit": "box"},
    ],
    "tihar": [
        {"name": "Diya", "quantity": 8, "unit": "pcs"},
        {"name": "Marigold Flowers", "quantity": 1, "unit": "pack"},
        {"name": "Ghee", "quantity": 250, "unit": "ml"},
        {"name": "Rice", "quantity": 1, "unit": "kg"},
        {"name": "Incense Sticks", "quantity": 1, "unit": "pack"},
        {"name": "Rangoli Items", "quantity": 1, "unit": "pack"},
    ],
}


def _pattern_for_puja_name(puja_name: str):
    normalized = (puja_name or "").strip().lower()
    if not normalized:
        return []

    aliases = {
        "birthday": ["birthday", "birthday ceremony", "janmadin", "birth day"],
        "naming": ["naming", "name ceremony", "naming ceremony", "naming", "namkaran", "namkaran puja", "nwaran", "naamkaran"],
        "bratabandha": ["bratabandha", "bratabanda", "janai"],
        "bibaha": ["bibaha", "marriage", "wedding", "bihe"],
        "pasni": ["pasni", "annaprashan", "rice feeding"],
        "satyanarayan": ["satyanarayan", "satya narayan"],
        "ganesh": ["ganesh", "ganesha", "ganpati"],
        "saraswati": ["saraswati", "sarswati"],
        "laxmi": ["laxmi", "lakshmi"],
        "teej": ["teej"],
        "dashain": ["dashain", "dashami"],
        "tihar": ["tihar", "deepawali", "diwali"],
    }

    for key, keys in aliases.items():
        if any(k in normalized for k in keys):
            return PUJA_ITEM_PATTERNS.get(key, [])

    return []


def _get_known_puja_key(puja_name: str) -> str | None:
    normalized = (puja_name or "").strip().lower()
    if not normalized:
        return None

    aliases = {
        "birthday": ["birthday", "birthday ceremony", "janmadin", "birth day"],
        "naming": ["naming", "name ceremony", "naming ceremony", "namkaran", "namkaran puja", "nwaran", "naamkaran"],
        "bratabandha": ["bratabandha", "bratabanda", "janai"],
        "bibaha": ["bibaha", "marriage", "wedding", "bihe"],
        "pasni": ["pasni", "annaprashan", "rice feeding"],
        "satyanarayan": ["satyanarayan", "satya narayan"],
        "ganesh": ["ganesh", "ganesha", "ganpati"],
        "saraswati": ["saraswati", "sarswati"],
        "laxmi": ["laxmi", "lakshmi"],
        "teej": ["teej"],
        "dashain": ["dashain", "dashami"],
        "tihar": ["tihar", "deepawali", "diwali"],
    }

    for key, keys in aliases.items():
        if any(k in normalized for k in keys):
            return key
    return None


def _canonicalize_item_name(value: str) -> str:
    return " ".join((value or "").strip().lower().replace("-", " ").split())


def _is_allowed_for_puja(puja_key: str | None, item_name: str) -> bool:
    if not puja_key:
        return True

    normalized_item = _canonicalize_item_name(item_name)
    if not normalized_item:
        return False

    allowed_pattern = PUJA_ITEM_PATTERNS.get(puja_key, [])
    if not allowed_pattern:
        return True

    # Build allowed tokens from canonical pattern names + safe aliases
    allowed_names = {_canonicalize_item_name(i.get("name", "")) for i in allowed_pattern}
    alias_map = {
        "incense sticks": {"agarbatti", "dhup", "incense"},
        "sweets": {"laddu", "mithai", "sweet"},
        "lakshmi idol": {"laxmi idol", "idol", "murti"},
        "sacred thread": {"janai", "thread"},
        "red flowers": {"flowers"},
        "white flowers": {"flowers"},
        "lotus flowers": {"lotus", "flowers"},
    }

    # Exact/contains match against allowed names
    for allowed in allowed_names:
        if not allowed:
            continue
        if normalized_item == allowed or allowed in normalized_item or normalized_item in allowed:
            return True

        for alias in alias_map.get(allowed, set()):
            alias_n = _canonicalize_item_name(alias)
            if alias_n and (alias_n == normalized_item or alias_n in normalized_item or normalized_item in alias_n):
                return True

    return False


def _is_explicitly_requested(user_notes: str, item_name: str) -> bool:
    notes = _canonicalize_item_name(user_notes)
    name = _canonicalize_item_name(item_name)
    if not notes or not name:
        return False
    return name in notes


def _apply_do_not_cross_puja_guard(
    puja_name: str,
    products: list[dict],
    actions: list[dict],
    missing_items: list[dict],
    suggested_alternatives: list[dict],
    user_notes: str = "",
):
    puja_key = _get_known_puja_key(puja_name)
    if not puja_key:
        return products, actions, missing_items, suggested_alternatives, []

    blocked = []
    allowed_products = []
    allowed_ids = set()

    for p in products:
        name = p.get("name", "")
        if _is_allowed_for_puja(puja_key, name) or _is_explicitly_requested(user_notes, name):
            allowed_products.append(p)
            pid = p.get("id")
            if pid is not None:
                allowed_ids.add(pid)
        else:
            blocked.append({"name": name, "reason": "out_of_pattern_hard_block"})

    filtered_actions = []
    for action in actions:
        if action.get("type") != "ADD_TO_CART":
            filtered_actions.append(action)
            continue

        product_payload = action.get("product", {}) or {}
        pname = product_payload.get("title") or product_payload.get("name") or ""
        pid = product_payload.get("id")

        if pid is not None and pid in allowed_ids:
            filtered_actions.append(action)
        elif _is_allowed_for_puja(puja_key, pname) or _is_explicitly_requested(user_notes, pname):
            filtered_actions.append(action)
        else:
            blocked.append({"name": pname, "reason": "action_out_of_pattern_hard_block"})

    filtered_alternatives = [
        a for a in suggested_alternatives if _is_allowed_for_puja(puja_key, a.get("name", "")) or _is_explicitly_requested(user_notes, a.get("name", ""))
    ]

    # Include blocked item names in missing list so UI can still show what got blocked.
    for b in blocked:
        missing_items.append({
            "name": b.get("name") or "Unknown item",
            "quantity": 1,
            "unit": "pcs",
            "reason": b["reason"],
        })

    return allowed_products, filtered_actions, missing_items, filtered_alternatives, blocked


def _find_db_item_by_name_or_alias(name: str):
    if not name:
        return None

    alias_map = {
        "janai": ["sacred thread", "thread"],
        "lakshmi idol": ["laxmi idol", "idol", "murti"],
        "modak": ["laddu", "sweet"],
        "incense sticks": ["agarbatti", "dhup", "incense"],
        "red flowers": ["flowers"],
        "white flowers": ["flowers"],
        "lotus flowers": ["flowers", "lotus"],
        "rangoli items": ["rangoli", "color powder"],
        "tika": ["vermilion", "kumkum"],
    }

    qs = SamagriItem.objects.filter(is_active=True).select_related("category")
    candidate = qs.filter(name__icontains=name).order_by("-created_at").first()
    if candidate:
        return candidate

    for token in name.lower().replace("-", " ").split():
        if len(token) >= 3:
            candidate = qs.filter(Q(name__icontains=token) | Q(description__icontains=token)).order_by("-created_at").first()
            if candidate:
                return candidate

    for alias in alias_map.get(name.lower(), []):
        candidate = qs.filter(Q(name__icontains=alias) | Q(description__icontains=alias)).order_by("-created_at").first()
        if candidate:
            return candidate

    return None


def _abs_image_url(request, image_field):
    if not image_field:
        return None
    try:
        if request is not None:
            return request.build_absolute_uri(image_field.url)
        return image_field.url
    except Exception:
        return None


def search_samagri(request, query: str, limit: int = 5) -> ToolExecutionResult:
    normalized = (query or "").strip().lower()

    alias_map = {
        "murti": ["idol", "statue", "ganesh", "ganesha", "moorti"],
        "ganesh": ["ganesha", "ganpati", "vinayak"],
        "book": ["granth", "gita", "ramayan", "mahabharat"],
        "samagri": ["puja", "ritual", "aarti"],
    }

    qs = SamagriItem.objects.filter(
        Q(name__icontains=query) | Q(description__icontains=query) | Q(category__name__icontains=query),
        is_active=True,
    ).select_related("category").distinct()[: max(1, min(limit, 10))]

    if not qs.exists() and normalized:
        tokens = [t for t in normalized.replace("-", " ").split() if len(t) >= 3]
        q_obj = Q()
        for token in tokens:
            q_obj |= Q(name__icontains=token) | Q(description__icontains=token) | Q(category__name__icontains=token)
            for alias in alias_map.get(token, []):
                q_obj |= Q(name__icontains=alias) | Q(description__icontains=alias) | Q(category__name__icontains=alias)

        if q_obj:
            qs = SamagriItem.objects.filter(q_obj, is_active=True).select_related("category").distinct()[: max(1, min(limit, 10))]

    # Last fallback: popular active items so chat UI still shows actionable cards
    if not qs.exists():
        qs = SamagriItem.objects.filter(is_active=True).select_related("category").order_by("-created_at")[: max(1, min(limit, 10))]

    products = [
        {
            "id": i.id,
            "name": i.name,
            "price": float(i.price),
            "image": _abs_image_url(request, i.image),
            "category": i.category.name if i.category else None,
            "stock": i.stock_quantity,
        }
        for i in qs
    ]
    return ToolExecutionResult(
        ok=True,
        type=RESPONSE_TYPES["PRODUCT_LIST"],
        data={"products": products},
        message=f"Found {len(products)} items for '{query}'." if products else f"No items found for '{query}'.",
    )


def _find_alternative_item(base_item: SamagriItem | None, fallback_name: str = "", used_ids: set[int] | None = None):
    qs = SamagriItem.objects.filter(is_active=True, stock_quantity__gt=0).select_related("category")
    if used_ids:
        qs = qs.exclude(id__in=list(used_ids))

    if base_item and base_item.category_id:
        candidate = qs.filter(category=base_item.category).exclude(id=base_item.id).order_by("-created_at").first()
        if candidate:
            return candidate

    for token in (fallback_name or "").lower().replace("-", " ").split():
        if len(token) >= 3:
            candidate = qs.filter(Q(name__icontains=token) | Q(description__icontains=token)).order_by("-created_at").first()
            if candidate:
                return candidate

    # Important: avoid random unrelated fallback (e.g. same Kumkum for everything)
    return None


def recommend_puja_samagri(
    request,
    puja_id: int,
    location: str = "ONLINE",
    budget_preference: str = "standard",
    user_notes: str = "",
    auto_add_alternatives: bool = True,
    limit: int = 12,
) -> ToolExecutionResult:
    puja = Puja.objects.filter(id=puja_id).first()
    if not puja:
        return ToolExecutionResult(
            ok=False,
            type=RESPONSE_TYPES["TEXT"],
            data={},
            message="Puja not found.",
        )

    requirements = PujaSamagriRequirement.objects.filter(puja=puja).select_related("samagri_item__category")
    if not requirements.exists():
        pattern_items = _pattern_for_puja_name(puja.name)

        products = []
        actions = []
        missing_items = []
        suggested_alternatives = []
        used_product_ids = set()

        if pattern_items:
            for p_item in pattern_items[: max(1, min(int(limit), 30))]:
                item_name = p_item.get("name")
                qty = int(p_item.get("quantity", 1))
                unit = p_item.get("unit", "pcs")

                db_item = _find_db_item_by_name_or_alias(item_name)
                if db_item and db_item.stock_quantity > 0 and db_item.id not in used_product_ids:
                    card = {
                        "id": db_item.id,
                        "name": db_item.name,
                        "price": float(db_item.price),
                        "image": _abs_image_url(request, db_item.image),
                        "category": db_item.category.name if db_item.category else None,
                        "stock": db_item.stock_quantity,
                        "quantity": qty,
                        "unit": unit,
                        "is_essential": True,
                        "source": "puja_pattern_db_match",
                    }
                    products.append(card)
                    used_product_ids.add(db_item.id)
                    actions.append({
                        "type": "ADD_TO_CART",
                        "product": {
                            "id": db_item.id,
                            "title": db_item.name,
                            "price": float(db_item.price),
                            "image": _abs_image_url(request, db_item.image),
                        },
                        "quantity": qty,
                    })
                    continue

                missing_items.append({
                    "name": item_name,
                    "quantity": qty,
                    "unit": unit,
                    "reason": "not_available" if not db_item else "out_of_stock",
                })

                alt = _find_alternative_item(db_item, fallback_name=item_name, used_ids=used_product_ids)
                if not alt or alt.id in used_product_ids:
                    continue

                alt_card = {
                    "for_item": item_name,
                    "id": alt.id,
                    "name": alt.name,
                    "price": float(alt.price),
                    "image": _abs_image_url(request, alt.image),
                    "category": alt.category.name if alt.category else None,
                    "stock": alt.stock_quantity,
                    "quantity": qty,
                    "unit": alt.unit or unit,
                    "is_essential": False,
                    "is_alternative": True,
                    "source": "puja_pattern_ai_alternative",
                }
                suggested_alternatives.append(alt_card)
                products.append(alt_card)
                used_product_ids.add(alt.id)

                if auto_add_alternatives:
                    actions.append({
                        "type": "ADD_TO_CART",
                        "product": {
                            "id": alt.id,
                            "title": alt.name,
                            "price": float(alt.price),
                            "image": _abs_image_url(request, alt.image),
                        },
                        "quantity": qty,
                    })
        else:
            fallback = search_samagri(request, puja.name, limit=min(limit, 8))
            products = fallback.data.get("products", [])
            actions = [
                {
                    "type": "ADD_TO_CART",
                    "product": {
                        "id": p.get("id"),
                        "title": p.get("name"),
                        "price": p.get("price", 0),
                        "image": p.get("image"),
                    },
                    "quantity": 1,
                }
                for p in products
            ]

        data = {
            "products": products,
            "actions": actions,
            "missing_items": missing_items,
            "suggested_alternatives": suggested_alternatives,
            "context": {
                "puja_id": puja.id,
                "puja_name": puja.name,
                "source": "puja-pattern" if pattern_items else "fallback-search",
                "location": location,
                "budget_preference": budget_preference,
                "notes": user_notes,
            },
        }

        guarded_products, guarded_actions, guarded_missing, guarded_alternatives, blocked_items = _apply_do_not_cross_puja_guard(
            puja_name=puja.name,
            products=data["products"],
            actions=data["actions"],
            missing_items=data["missing_items"],
            suggested_alternatives=data["suggested_alternatives"],
            user_notes=user_notes,
        )
        data["products"] = guarded_products
        data["actions"] = guarded_actions
        data["missing_items"] = guarded_missing
        data["suggested_alternatives"] = guarded_alternatives
        data["context"]["blocked_out_of_pattern_count"] = len(blocked_items)

        return ToolExecutionResult(
            ok=True,
            type=RESPONSE_TYPES["MIXED"],
            data=data,
            message="Puja-specific pattern applied. Missing items were replaced with best available alternatives.",
        )

    products = []
    actions = []
    missing_items = []
    suggested_alternatives = []
    used_product_ids = set()

    effective_limit = max(1, min(int(limit), 30))

    for req in requirements[:effective_limit]:
        item = req.samagri_item
        quantity = int(req.quantity or 1)
        unit = req.unit or item.unit or "pcs"

        if item and item.is_active and item.stock_quantity > 0 and item.id not in used_product_ids:
            product = {
                "id": item.id,
                "name": item.name,
                "price": float(item.price),
                "image": _abs_image_url(request, item.image),
                "category": item.category.name if item.category else None,
                "stock": item.stock_quantity,
                "quantity": quantity,
                "unit": unit,
                "is_essential": True,
                "source": "puja_requirement",
            }
            products.append(product)
            used_product_ids.add(item.id)
            actions.append({
                "type": "ADD_TO_CART",
                "product": {
                    "id": item.id,
                    "title": item.name,
                    "price": float(item.price),
                    "image": _abs_image_url(request, item.image),
                },
                "quantity": quantity,
            })
            continue

        reason = "out_of_stock" if item and item.is_active and item.stock_quantity <= 0 else "not_available"
        missing_name = item.name if item else "Unknown item"
        missing_items.append({
            "name": missing_name,
            "quantity": quantity,
            "unit": unit,
            "reason": reason,
        })

        alt = _find_alternative_item(item, fallback_name=missing_name, used_ids=used_product_ids)
        if not alt or alt.id in used_product_ids:
            continue

        alt_obj = {
            "for_item": missing_name,
            "id": alt.id,
            "name": alt.name,
            "price": float(alt.price),
            "image": _abs_image_url(request, alt.image),
            "category": alt.category.name if alt.category else None,
            "stock": alt.stock_quantity,
            "quantity": quantity,
            "unit": alt.unit or unit,
            "is_essential": False,
            "is_alternative": True,
            "source": "ai_alternative",
        }
        suggested_alternatives.append(alt_obj)
        products.append(alt_obj)
        used_product_ids.add(alt.id)

        if auto_add_alternatives:
            actions.append({
                "type": "ADD_TO_CART",
                "product": {
                    "id": alt.id,
                    "title": alt.name,
                    "price": float(alt.price),
                    "image": _abs_image_url(request, alt.image),
                },
                "quantity": quantity,
            })

    guarded_products, guarded_actions, guarded_missing, guarded_alternatives, blocked_items = _apply_do_not_cross_puja_guard(
        puja_name=puja.name,
        products=products,
        actions=actions,
        missing_items=missing_items,
        suggested_alternatives=suggested_alternatives,
        user_notes=user_notes,
    )

    return ToolExecutionResult(
        ok=True,
        type=RESPONSE_TYPES["MIXED"],
        data={
            "products": guarded_products,
            "actions": guarded_actions,
            "missing_items": guarded_missing,
            "suggested_alternatives": guarded_alternatives,
            "context": {
                "puja_id": puja.id,
                "puja_name": puja.name,
                "location": location,
                "budget_preference": budget_preference,
                "notes": user_notes,
                "requirements_count": requirements.count(),
                "blocked_out_of_pattern_count": len(blocked_items),
            },
        },
        message="Fetched puja-specific samagri from database and prepared cart actions.",
    )


def find_pandits(language: str | None = None, expertise: str | None = None, limit: int = 5) -> ToolExecutionResult:
    qs = PanditUser.objects.filter(is_verified=True)
    if language:
        qs = qs.filter(language__icontains=language)
    if expertise:
        qs = qs.filter(expertise__icontains=expertise)

    qs = qs.order_by("-rating")[: max(1, min(limit, 10))]
    pandits = [
        {
            "id": p.id,
            "name": p.full_name or p.username,
            "expertise": p.expertise,
            "language": p.language,
            "rating": float(p.rating),
            "experience_years": p.experience_years,
            "is_available": p.is_available,
            "profile_pic": _abs_image_url(None, p.profile_pic) if p.profile_pic else None,
        }
        for p in qs
    ]

    return ToolExecutionResult(
        ok=True,
        type=RESPONSE_TYPES["PANDIT_LIST"],
        data={"pandits": pandits},
        message=f"Found {len(pandits)} pandits." if pandits else "No matching pandits found.",
    )


def get_booking_status(user, booking_id: int) -> ToolExecutionResult:
    qs = Booking.objects.select_related("pandit")

    if user.is_authenticated and (user.is_superuser or user.is_staff or user.role in ("admin", "superadmin")):
        booking = qs.filter(id=booking_id).first()
    elif user.is_authenticated and user.role == "pandit":
        booking = qs.filter(id=booking_id, pandit_id=user.id).first()
    elif user.is_authenticated:
        booking = qs.filter(id=booking_id, user=user).first()
    else:
        booking = None

    if not booking:
        return ToolExecutionResult(
            ok=False,
            type=RESPONSE_TYPES["TEXT"],
            data={},
            message="Booking not found or access denied.",
        )

    booking_data = {
        "id": booking.id,
        "status": booking.status,
        "service_name": booking.service_name,
        "booking_date": str(booking.booking_date),
        "booking_time": str(booking.booking_time),
        "pandit_name": booking.pandit.full_name or booking.pandit.username,
        "payment_status": booking.payment_status,
        "payment_method": booking.payment_method,
        "transaction_id": booking.transaction_id,
    }

    return ToolExecutionResult(
        ok=True,
        type=RESPONSE_TYPES["BOOKING_STATUS"],
        data={"bookings": [booking_data]},
        message=f"Booking {booking.id} is currently {booking.status}.",
    )


def list_my_bookings(user, status: str | None = None, limit: int = 5) -> ToolExecutionResult:
    if not user.is_authenticated:
        return ToolExecutionResult(ok=False, type=RESPONSE_TYPES["TEXT"], message="Login required to view bookings.")

    qs = Booking.objects.filter(user=user).select_related("pandit").order_by("-created_at")
    if status:
        qs = qs.filter(status=status)
    qs = qs[: max(1, min(limit, 20))]

    bookings = [
        {
            "id": b.id,
            "status": b.status,
            "service_name": b.service_name,
            "booking_date": str(b.booking_date),
            "booking_time": str(b.booking_time),
            "pandit_name": b.pandit.full_name or b.pandit.username,
            "payment_status": b.payment_status,
        }
        for b in qs
    ]

    return ToolExecutionResult(
        ok=True,
        type=RESPONSE_TYPES["BOOKING_LIST"],
        data={"bookings": bookings},
        message=f"You have {len(bookings)} bookings.",
    )


def add_to_cart_intent(product_id: int | None = None, product_name: str | None = None, quantity: int = 1) -> ToolExecutionResult:
    item = None
    if product_id is not None:
        item = SamagriItem.objects.filter(id=product_id, is_active=True).first()
    elif product_name:
        item = SamagriItem.objects.filter(
            Q(name__icontains=product_name) | Q(description__icontains=product_name),
            is_active=True,
        ).order_by("-created_at").first()

    if not item:
        return ToolExecutionResult(ok=False, type=RESPONSE_TYPES["TEXT"], message="Product not found. Please share a clearer item name.")

    return ToolExecutionResult(
        ok=True,
        type=RESPONSE_TYPES["MIXED"],
        data={
            "products": [
                {
                    "id": item.id,
                    "name": item.name,
                    "price": float(item.price),
                    "image": _abs_image_url(None, item.image),
                }
            ],
            "actions": [
                {
                    "type": "ADD_TO_CART",
                    "product": {
                        "id": item.id,
                        "title": item.name,
                        "price": float(item.price),
                    },
                    "quantity": max(1, quantity),
                }
            ]
        },
        message=f"Prepared add-to-cart action for {item.name}.",
    )


def how_to_book() -> ToolExecutionResult:
    return ToolExecutionResult(
        ok=True,
        type=RESPONSE_TYPES["TEXT"],
        message=(
            "To book a pandit: 1) Open Find Pandits, 2) Choose profile and service, 3) Pick date/time, "
            "4) Complete payment, 5) Track booking from dashboard."
        ),
    )


def how_kundali_works() -> ToolExecutionResult:
    return ToolExecutionResult(
        ok=True,
        type=RESPONSE_TYPES["TEXT"],
        message=(
            "Kundali works in dual mode: online high-precision generation and offline local generation for low/no internet. "
            "In online mode you can save charts to dashboard."
        ),
    )


def switch_to_realtime_chat(user, booking_id: int | None = None, pandit_id: int | None = None, pandit_name: str | None = None) -> ToolExecutionResult:
    actions = []
    if booking_id and user.is_authenticated:
        room = ChatRoom.objects.filter(booking_id=booking_id).first()
        if room:
            actions.append({
                "type": "SWITCH_MODE",
                "bookingId": str(room.id),
                "panditName": room.pandit.user.full_name or room.pandit.user.username,
            })

    if not actions and booking_id:
        actions.append({
            "type": "SWITCH_MODE",
            "bookingId": str(booking_id),
            "panditName": pandit_name or "Pandit",
        })

    if not actions and pandit_id and user.is_authenticated:
        pandit = Pandit.objects.filter(id=pandit_id).select_related("user").first()
        if pandit:
            room, _ = ChatRoom.objects.get_or_create(
                customer=user,
                pandit=pandit,
                is_pre_booking=True,
                defaults={"is_active": True},
            )
            actions.append({
                "type": "SWITCH_MODE",
                "bookingId": str(room.id),
                "panditName": pandit.user.full_name or pandit.user.username,
            })

    return ToolExecutionResult(
        ok=True,
        type=RESPONSE_TYPES["MIXED"],
        data={"actions": actions},
        message="You can switch to real-time chat now." if actions else "No realtime chat room found yet.",
    )
