import frappe


def check_non_stock_items(doc, method=None):
    for row in doc.items:
        is_stock_item = frappe.db.get_value(
            "Item",
            row.item_code,
            "is_stock_item"
        )

        if not is_stock_item:
            doc.flags.ignore_validate = True
            break
