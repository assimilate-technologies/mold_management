import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_field

def execute():
    # Skip if field already exists
    if frappe.db.exists("Custom Field", "Job Card-is_mould"):
        return

    field = {
        "fieldname": "is_mould",
        "label": "Is Mould",
        "fieldtype": "Check",
        "insert_after": "production_item",
       
        "read_only": 1,
        "fetch_from": "production_item.is_mould_item"
    }

    create_custom_field("Job Card", field, ignore_validate=True)

    frappe.db.commit()
    frappe.clear_cache(doctype="Job Card")
