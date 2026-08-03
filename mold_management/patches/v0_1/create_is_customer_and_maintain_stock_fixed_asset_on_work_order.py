import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_field


def execute():
    print("Adding custom fields to Work Order...")

    fields = [
        {
            "fieldname": "maintain_stock",
            "label": "Maintain Stock",
            "fieldtype": "Check",
            "insert_after": "is_mould_item",
            "hidden":1,
            "fetch_from": "production_item.is_stock_item",
        },
        {
            "fieldname": "is_fixed_asset",
            "label": "Is Fixed Asset",
            "fieldtype": "Check",
            "insert_after": "maintain_stock",
            "hidden":1,
            "fetch_from": "production_item.is_fixed_asset",
        },
        {
            "fieldname": "is_customer_provided_item",
            "label": "Is Customer Provided Item",
            "fieldtype": "Check",
            "insert_after": "is_fixed_asset",
            "hidden":1,
            "fetch_from": "production_item.is_customer_provided_item",
        },

    ]

    for field in fields:
        try:
            create_custom_field("Work Order", field)
            print(f"Created: {field['fieldname']}")
        except Exception as e:
            print(f"Skipping {field['fieldname']} (maybe exists) → {e}")

    frappe.clear_cache()
    print("Custom fields added successfully.")
